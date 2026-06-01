import { useEffect, useState, useRef } from "react";
import api from "../../api/client";
import { Layout, Modal } from "../../components/UI";
import { useSocket } from "../../context/SocketContext";
import { uploadFile, firebaseReady } from "../../api/firebase";
import {
  Plus, Send, Pencil, Trash2, Link2, UploadCloud, X, Clock,
  CheckCircle2, XCircle, ImageIcon, Heart, MapPin, CalendarDays,
  ArrowLeft, ArrowRight, Check, FileText, Palette, Image as ImgIcon,
  Loader2, AlertTriangle, Music2, Play, Pause, Lock,
} from "lucide-react";

const emptyForm = {
  groomName: "", brideName: "", weddingDate: "", weddingTime: "18:00",
  description: "", design: "", music: "", images: [],
};

const DESC_EXAMPLE =
  "Mehmonlarga qisqa so'z (ixtiyoriy). Masalan: Sizni shu quvonchli kunimizda ko'rishdan mamnun bo'lamiz.";

const acceptMeta = {
  pending: { text: "Kutilmoqda", cls: "pending", Icon: Clock },
  accepted: { text: "Qabul qilingan", cls: "accepted", Icon: CheckCircle2 },
  rejected: { text: "Rad etilgan", cls: "rejected", Icon: XCircle },
};

const STEPS = [
  { n: 1, label: "Asosiy", Icon: Heart },
  { n: 2, label: "Dizayn", Icon: Palette },
  { n: 3, label: "Musiqa", Icon: Music2 },
  { n: 4, label: "Tasdiq", Icon: Check },
];

export default function Invitations() {
  const [list, setList] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [music, setMusic] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  // Yuborilgan taklifnoma uchun cheklangan tahrir (faqat ism + soat)
  const [sentEdit, setSentEdit] = useState(null);
  const [previewMusic, setPreviewMusic] = useState(null);
  const fileRef = useRef(null);
  const audioRef = useRef(null);
  const { lastEvent } = useSocket() || {};

  const load = () => {
    setLoading(true);
    api.get("/venue/invitations").then((r) => setList(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);
  useEffect(() => {
    api.get("/designs").then((r) => setDesigns(r.data)).catch(() => {});
    api.get("/music").then((r) => setMusic(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (lastEvent && ["accepted", "rejected", "updated"].includes(lastEvent.type)) {
      api.get("/venue/invitations").then((r) => setList(r.data));
    }
  }, [lastEvent]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setStep(1); setModal(true); };
  const openEditDraft = (inv) => {
    setEditing(inv);
    setForm({
      groomName: inv.groomName, brideName: inv.brideName,
      weddingDate: inv.weddingDate?.slice(0, 10), weddingTime: inv.weddingTime,
      description: inv.description || "",
      design: inv.design || "", music: inv.music || "",
      images: inv.images || [],
    });
    setStep(1); setModal(true);
  };

  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const onPickFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (!firebaseReady) { alert("Firebase sozlanmagan. .env (VITE_FIREBASE_*) ni to'ldiring."); return; }
    setUploading(true);
    try {
      const urls = [];
      for (const f of files) urls.push(await uploadFile(f));
      setForm((s) => ({ ...s, images: [...s.images, ...urls] }));
    } catch (err) {
      alert("Rasm yuklashda xato: " + err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeImage = (url) => setForm((s) => ({ ...s, images: s.images.filter((u) => u !== url) }));

  const canNext = () => {
    if (step === 1) return form.groomName && form.brideName && form.weddingDate;
    if (step === 2) return !!form.design;
    return true;
  };

  const next = () => {
    if (!canNext()) {
      alert(step === 2 ? "Iltimos, dizayn tanlang." : "Majburiy maydonlarni to'ldiring (kuyov, kelin, sana).");
      return;
    }
    setStep((s) => Math.min(4, s + 1));
  };
  const back = () => setStep((s) => Math.max(1, s - 1));

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, design: form.design || null, music: form.music || null };
      if (editing) await api.put(`/venue/invitations/${editing._id}`, payload);
      else await api.post("/venue/invitations", payload);
      setModal(false); load();
    } finally {
      setSaving(false);
    }
  };

  const send = async (inv) => {
    if (!window.confirm("Taklifnomani yuborasizmi? Yuborilgach bosh admin tasdiqlaydi.")) return;
    await api.put(`/venue/invitations/${inv._id}/send`);
    load();
  };
  const remove = async (inv) => {
    if (!window.confirm("O'chirasizmi?")) return;
    await api.delete(`/venue/invitations/${inv._id}`);
    load();
  };
  const copyLink = (inv) => {
    const url = `${window.location.origin}/i/${inv._id}`;
    navigator.clipboard.writeText(url);
    alert("Havola nusxalandi:\n" + url);
  };

  // ---- Yuborilgan taklifnoma: cheklangan tahrir ----
  const openSentEdit = (inv) => {
    setSentEdit({ _id: inv._id, groomName: inv.groomName, brideName: inv.brideName, weddingTime: inv.weddingTime });
  };
  const saveSentEdit = async () => {
    try {
      await api.put(`/venue/invitations/${sentEdit._id}`, {
        groomName: sentEdit.groomName, brideName: sentEdit.brideName, weddingTime: sentEdit.weddingTime,
      });
      setSentEdit(null); load();
    } catch (err) {
      alert(err.response?.data?.message || "Xatolik");
    }
  };

  const togglePreview = (m) => {
    if (previewMusic === m._id) { audioRef.current?.pause(); setPreviewMusic(null); }
    else { if (audioRef.current) { audioRef.current.src = m.url; audioRef.current.play().catch(() => {}); } setPreviewMusic(m._id); }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("uz") : "—";
  const designName = (id) => designs.find((d) => d._id === id)?.name || "—";
  const musicName = (id) => music.find((m) => m._id === id)?.name || "—";

  return (
    <Layout title="Taklifnomalar">
      <audio ref={audioRef} onEnded={() => setPreviewMusic(null)} hidden />
      <div className="card">
        <div className="card-head">
          <h2>Mening taklifnomalarim</h2>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={18} /> Yangi taklifnoma</button>
        </div>

        {loading ? (
          <div className="loading">Yuklanmoqda...</div>
        ) : list.length === 0 ? (
          <div className="empty">Hali taklifnoma yo'q. "Yangi taklifnoma" tugmasi orqali birinchisini yarating.</div>
        ) : (
          <div className="inv-grid">
            {list.map((inv) => {
              const am = acceptMeta[inv.acceptStatus] || acceptMeta.pending;
              return (
                <div key={inv._id} className="inv-card">
                  <div className="inv-thumb">
                    {inv.images?.[0] ? <img src={inv.images[0]} alt="" /> : <div className="inv-thumb-empty"><ImageIcon size={28} /></div>}
                    <span className={`badge ${inv.status} float`}>{inv.status === "sent" ? "Yuborilgan" : "Qoralama"}</span>
                  </div>
                  <div className="inv-body">
                    <div className="inv-couple"><Heart size={15} /> {inv.groomName} & {inv.brideName}</div>
                    <div className="inv-meta"><CalendarDays size={14} /> {fmtDate(inv.weddingDate)} • {inv.weddingTime}</div>

                    {inv.status === "sent" && (
                      <div className={`accept-pill ${am.cls}`}><am.Icon size={14} /> {am.text}</div>
                    )}

                    <div className="inv-actions">
                      <button className="icon-btn" onClick={() => copyLink(inv)} title="Havola"><Link2 size={16} /></button>
                      {inv.status === "draft" ? (
                        <>
                          <button className="icon-btn" onClick={() => openEditDraft(inv)} title="Tahrirlash"><Pencil size={16} /></button>
                          <button className="icon-btn send" onClick={() => send(inv)} title="Yuborish"><Send size={16} /></button>
                          <button className="icon-btn del" onClick={() => remove(inv)} title="O'chirish"><Trash2 size={16} /></button>
                        </>
                      ) : inv.venueEditUsed ? (
                        <span className="inv-lock" title="Bu taklifnoma allaqachon bir marta tahrirlangan"><Lock size={14} /> tahrir tugagan</span>
                      ) : (
                        <button className="icon-btn" onClick={() => openSentEdit(inv)} title="Ism va soatni tahrirlash (1 marta)"><Pencil size={16} /></button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== YARATISH / QORALAMA TAHRIRI (wizard) ===== */}
      {modal && (
        <Modal title={editing ? "Taklifnomani tahrirlash" : "Yangi taklifnoma"} onClose={() => setModal(false)}>
          <div className="wiz-steps">
            {STEPS.map((st, i) => (
              <div key={st.n} style={{ display: "contents" }}>
                <div className={`wiz-step ${step === st.n ? "active" : ""} ${step > st.n ? "done" : ""}`}>
                  <div className="wiz-dot">{step > st.n ? <Check size={16} /> : <st.Icon size={16} />}</div>
                  <div className="wiz-label">{st.label}</div>
                </div>
                {i < STEPS.length - 1 && <div className={`wiz-conn ${step > st.n ? "filled" : ""}`} />}
              </div>
            ))}
          </div>

          {/* 1: Asosiy */}
          {step === 1 && (
            <div className="wiz-panel">
              <div className="wiz-head"><Heart size={17} /> Kuyov-kelin va sana</div>
              <div className="wiz-sub">Taklifnomaning asosiy ma'lumotlari</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-group"><label>Kuyov ismi *</label><input value={form.groomName} onChange={(e) => set("groomName", e.target.value)} placeholder="Umid" /></div>
                <div className="form-group"><label>Kelin ismi *</label><input value={form.brideName} onChange={(e) => set("brideName", e.target.value)} placeholder="Maftuna" /></div>
                <div className="form-group"><label>To'y sanasi *</label><input type="date" value={form.weddingDate} onChange={(e) => set("weddingDate", e.target.value)} /></div>
                <div className="form-group"><label>Vaqti</label><input type="time" value={form.weddingTime} onChange={(e) => set("weddingTime", e.target.value)} /></div>
              </div>
            </div>
          )}

          {/* 2: Dizayn */}
          {step === 2 && (
            <div className="wiz-panel">
              <div className="wiz-head"><Palette size={17} /> Dizayn tanlang</div>
              <div className="wiz-sub">Taklifnoma web-sahifasi shu ko'rinishda bo'ladi</div>
              {designs.length === 0 ? (
                <div className="empty">Hozircha dizaynlar mavjud emas. Bosh admin qo'shishi kerak.</div>
              ) : (
                <div className="design-pick">
                  {designs.map((d) => (
                    <button key={d._id} type="button"
                      className={`design-pick-card ${form.design === d._id ? "selected" : ""}`}
                      onClick={() => set("design", d._id)}>
                      <div className="design-pick-thumb">
                        {d.preview ? <img src={d.preview} alt={d.name} /> : <Palette size={26} />}
                        {form.design === d._id && <span className="design-pick-check"><Check size={16} /></span>}
                      </div>
                      <div className="design-pick-name">{d.name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3: Musiqa */}
          {step === 3 && (
            <div className="wiz-panel">
              <div className="wiz-head"><Music2 size={17} /> Fon musiqasi</div>
              <div className="wiz-sub">Ixtiyoriy — taklifnoma ochilganda ijro etiladi</div>
              <div className="music-pick">
                <button type="button" className={`music-row ${!form.music ? "selected" : ""}`} onClick={() => set("music", "")}>
                  <span className="music-row-name">Musiqasiz</span>
                  {!form.music && <Check size={16} />}
                </button>
                {music.map((m) => (
                  <div key={m._id} className={`music-row ${form.music === m._id ? "selected" : ""}`} onClick={() => set("music", m._id)}>
                    <button type="button" className="icon-btn" onClick={(e) => { e.stopPropagation(); togglePreview(m); }}>
                      {previewMusic === m._id ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <span className="music-row-name">{m.name}</span>
                    {form.music === m._id && <Check size={16} />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4: Rasm + tasdiq */}
          {step === 4 && (
            <div className="wiz-panel">
              <div className="wiz-head"><ImgIcon size={17} /> Rasm va tasdiq</div>
              <div className="wiz-sub">Rasm yuklang va ma'lumotlarni tekshiring</div>

              <div className="dropzone" onClick={() => !uploading && fileRef.current?.click()}>
                <div className="dz-ic"><UploadCloud size={24} /></div>
                {uploading ? (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Loader2 size={16} className="spin" /> Yuklanmoqda...</div>
                ) : (
                  <><div className="dz-title">Rasm tanlash</div><div className="dz-hint">Telefon/galereya • bir nechta bo'lishi mumkin</div></>
                )}
                <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onPickFiles} />
              </div>
              {!firebaseReady && <span className="hint-warn" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><AlertTriangle size={13} /> Firebase sozlanmagan (.env)</span>}

              {form.images.length > 0 && (
                <div className="thumb-grid">
                  {form.images.map((url) => (
                    <div key={url} className="thumb">
                      <img src={url} alt="" />
                      <button type="button" className="thumb-x" onClick={() => removeImage(url)}><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}

              <div className="form-group" style={{ marginTop: 14 }}>
                <label>Qisqa matn (ixtiyoriy)</label>
                <textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder={DESC_EXAMPLE} />
              </div>

              <div className="review-box">
                <div className="review-row"><span className="rk"><Heart size={14} /> Kuyov-kelin</span><span className="rv">{form.groomName} & {form.brideName}</span></div>
                <div className="review-row"><span className="rk"><CalendarDays size={14} /> Sana</span><span className="rv">{fmtDate(form.weddingDate)} • {form.weddingTime}</span></div>
                <div className="review-row"><span className="rk"><Palette size={14} /> Dizayn</span><span className="rv">{designName(form.design)}</span></div>
                <div className="review-row"><span className="rk"><Music2 size={14} /> Musiqa</span><span className="rv">{form.music ? musicName(form.music) : "Musiqasiz"}</span></div>
                <div className="review-row"><span className="rk"><ImgIcon size={14} /> Rasmlar</span><span className="rv">{form.images.length} ta</span></div>
              </div>
            </div>
          )}

          <div className="wiz-actions">
            {step > 1
              ? <button className="btn btn-ghost" onClick={back}><ArrowLeft size={16} /> Orqaga</button>
              : <button className="btn btn-ghost" onClick={() => setModal(false)}>Bekor qilish</button>}
            {step < 4
              ? <button className="btn btn-primary" onClick={next}>Keyingi <ArrowRight size={16} /></button>
              : <button className="btn btn-primary" onClick={save} disabled={saving || uploading}><Check size={16} /> {saving ? "Saqlanmoqda..." : "Saqlash"}</button>}
          </div>
        </Modal>
      )}

      {/* ===== YUBORILGAN: cheklangan tahrir (ism + soat, 1 marta) ===== */}
      {sentEdit && (
        <Modal title="Tahrirlash (faqat ism va soat)" onClose={() => setSentEdit(null)}>
          <div className="form-note" style={{ marginBottom: 12, display: "flex", gap: 6 }}>
            <AlertTriangle size={15} /> Diqqat: yuborilgan taklifnomani faqat <b>bir marta</b> tahrirlash mumkin.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group"><label>Kuyov ismi</label><input value={sentEdit.groomName} onChange={(e) => setSentEdit({ ...sentEdit, groomName: e.target.value })} /></div>
            <div className="form-group"><label>Kelin ismi</label><input value={sentEdit.brideName} onChange={(e) => setSentEdit({ ...sentEdit, brideName: e.target.value })} /></div>
          </div>
          <div className="form-group"><label>Vaqti</label><input type="time" value={sentEdit.weddingTime} onChange={(e) => setSentEdit({ ...sentEdit, weddingTime: e.target.value })} /></div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setSentEdit(null)}>Bekor qilish</button>
            <button className="btn btn-primary" onClick={saveSentEdit}><Check size={16} /> Saqlash</button>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
