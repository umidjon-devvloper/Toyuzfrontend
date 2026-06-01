import { useEffect, useState, useRef } from "react";
import api from "../../api/client";
import { Layout, Modal } from "../../components/UI";
import { useSocket } from "../../context/SocketContext";
import { uploadImage, firebaseReady } from "../../api/firebase";
import {
  Plus, Send, Pencil, Trash2, Link2, UploadCloud, X, Clock,
  CheckCircle2, XCircle, ImageIcon, Heart, MapPin, CalendarDays,
  ArrowLeft, ArrowRight, Check, FileText, Palette, Image as ImgIcon,
  Loader2, AlertTriangle,
} from "lucide-react";

const emptyForm = {
  groomName: "", brideName: "", weddingDate: "", weddingTime: "18:00",
  venueName: "", address: "", mapLink: "", description: "", template: "classic",
  images: [],
};

const DESC_EXAMPLE =
  "Masalan: Oltin va oq ranglarda, gulli bezakli. Yuqorida 'To'y taklifnomasi', " +
  "kuyov-kelin ismi katta, ostida sana va manzil. Rasmda biz yuborgan fotoni ishlating.";

const acceptMeta = {
  pending: { text: "Kutilmoqda", cls: "pending", Icon: Clock },
  accepted: { text: "Qabul qilingan", cls: "accepted", Icon: CheckCircle2 },
  rejected: { text: "Rad etilgan", cls: "rejected", Icon: XCircle },
};

const STEPS = [
  { n: 1, label: "Asosiy", Icon: Heart },
  { n: 2, label: "Joylashuv", Icon: MapPin },
  { n: 3, label: "Bezak", Icon: ImgIcon },
  { n: 4, label: "Tasdiq", Icon: Check },
];

const TEMPLATES = {
  classic: "Klassik (oq-oltin)",
  dark: "Tungi (qora)",
  floral: "Gulli",
};

export default function Invitations() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);
  const { lastEvent } = useSocket() || {};

  const load = () => {
    setLoading(true);
    api.get("/venue/invitations").then((r) => setList(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  useEffect(() => {
    if (lastEvent && (lastEvent.type === "accepted" || lastEvent.type === "rejected")) {
      api.get("/venue/invitations").then((r) => setList(r.data));
    }
  }, [lastEvent]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setStep(1); setModal(true); };
  const openEdit = (inv) => {
    setEditing(inv);
    setForm({
      groomName: inv.groomName, brideName: inv.brideName,
      weddingDate: inv.weddingDate?.slice(0, 10), weddingTime: inv.weddingTime,
      venueName: inv.venueName, address: inv.address, mapLink: inv.mapLink,
      description: inv.description || "", template: inv.template,
      images: inv.images || [],
    });
    setStep(1); setModal(true);
  };

  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const onPickFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (!firebaseReady) {
      alert("Firebase sozlanmagan. .env (VITE_FIREBASE_*) ni to'ldiring.");
      return;
    }
    setUploading(true);
    try {
      const urls = [];
      for (const f of files) urls.push(await uploadImage(f));
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
    return true;
  };

  const next = () => {
    if (!canNext()) { alert("Iltimos, majburiy maydonlarni to'ldiring (kuyov, kelin, sana)."); return; }
    setStep((s) => Math.min(4, s + 1));
  };
  const back = () => setStep((s) => Math.max(1, s - 1));

  const save = async () => {
    setSaving(true);
    try {
      if (editing) await api.put(`/venue/invitations/${editing._id}`, form);
      else await api.post("/venue/invitations", form);
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

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("uz") : "—";

  return (
    <Layout title="Taklifnomalar">
      <div className="card">
        <div className="card-head">
          <h2>Mening taklifnomalarim</h2>
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={18} /> Yangi taklifnoma
          </button>
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
                    {inv.images?.[0] ? (
                      <img src={inv.images[0]} alt="" />
                    ) : (
                      <div className="inv-thumb-empty"><ImageIcon size={28} /></div>
                    )}
                    <span className={`badge ${inv.status} float`}>
                      {inv.status === "sent" ? "Yuborilgan" : "Qoralama"}
                    </span>
                  </div>
                  <div className="inv-body">
                    <div className="inv-couple"><Heart size={15} /> {inv.groomName} & {inv.brideName}</div>
                    <div className="inv-meta"><CalendarDays size={14} /> {fmtDate(inv.weddingDate)} • {inv.weddingTime}</div>
                    <div className="inv-meta"><MapPin size={14} /> {inv.venueName || inv.address || "—"}</div>

                    {inv.status === "sent" && (
                      <div className={`accept-pill ${am.cls}`}>
                        <am.Icon size={14} /> {am.text}
                      </div>
                    )}

                    <div className="inv-actions">
                      <button className="icon-btn" onClick={() => copyLink(inv)} title="Havola"><Link2 size={16} /></button>
                      {inv.status === "draft" && (
                        <>
                          <button className="icon-btn" onClick={() => openEdit(inv)} title="Tahrirlash"><Pencil size={16} /></button>
                          <button className="icon-btn send" onClick={() => send(inv)} title="Yuborish"><Send size={16} /></button>
                          <button className="icon-btn del" onClick={() => remove(inv)} title="O'chirish"><Trash2 size={16} /></button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modal && (
        <Modal title={editing ? "Taklifnomani tahrirlash" : "Yangi taklifnoma"} onClose={() => setModal(false)}>
          {/* Bosqichlar progressi */}
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

          {/* 1-BOSQICH: Asosiy */}
          {step === 1 && (
            <div className="wiz-panel">
              <div className="wiz-head"><Heart size={17} /> Kuyov-kelin va sana</div>
              <div className="wiz-sub">Taklifnomaning asosiy ma'lumotlari</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label>Kuyov ismi *</label>
                  <input value={form.groomName} onChange={(e) => set("groomName", e.target.value)} placeholder="Umid" />
                </div>
                <div className="form-group">
                  <label>Kelin ismi *</label>
                  <input value={form.brideName} onChange={(e) => set("brideName", e.target.value)} placeholder="Maftuna" />
                </div>
                <div className="form-group">
                  <label>To'y sanasi *</label>
                  <input type="date" value={form.weddingDate} onChange={(e) => set("weddingDate", e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Vaqti</label>
                  <input type="time" value={form.weddingTime} onChange={(e) => set("weddingTime", e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* 2-BOSQICH: Joylashuv */}
          {step === 2 && (
            <div className="wiz-panel">
              <div className="wiz-head"><MapPin size={17} /> Joylashuv</div>
              <div className="wiz-sub">To'yxona nomi va manzili</div>
              <div className="form-group">
                <label>To'yxona nomi</label>
                <input value={form.venueName} onChange={(e) => set("venueName", e.target.value)} placeholder="Masalan: Bahor To'yxonasi" />
              </div>
              <div className="form-group">
                <label>Manzil</label>
                <input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Shahar, ko'cha, uy" />
              </div>
              <div className="form-group">
                <label>Google Map havolasi</label>
                <input value={form.mapLink} onChange={(e) => set("mapLink", e.target.value)} placeholder="https://maps.google.com/..." />
              </div>
            </div>
          )}

          {/* 3-BOSQICH: Rasm + tavsif */}
          {step === 3 && (
            <div className="wiz-panel">
              <div className="wiz-head"><ImgIcon size={17} /> Rasm va tavsif</div>
              <div className="wiz-sub">Rasm yuklang (telefon/galereya) va taklifnoma qanday bo'lishini yozing</div>

              <div className="dropzone" onClick={() => !uploading && fileRef.current?.click()}>
                <div className="dz-ic"><UploadCloud size={24} /></div>
                {uploading ? (
                  <div className="dz-uploading" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <Loader2 size={16} className="spin" /> Yuklanmoqda...
                  </div>
                ) : (
                  <>
                    <div className="dz-title">Rasm tanlash</div>
                    <div className="dz-hint">Telefon kamerasi yoki galereyadan • bir nechta bo'lishi mumkin</div>
                  </>
                )}
                <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onPickFiles} />
              </div>
              {!firebaseReady && (
                <span className="hint-warn" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <AlertTriangle size={13} /> Firebase sozlanmagan (.env)
                </span>
              )}

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

              <div className="form-group" style={{ marginTop: 16 }}>
                <label>Batafsil ma'lumot (taklifnoma qanday bo'lsin?)</label>
                <textarea rows={4} value={form.description}
                  onChange={(e) => set("description", e.target.value)} placeholder={DESC_EXAMPLE} />
              </div>
            </div>
          )}

          {/* 4-BOSQICH: Dizayn + tasdiq */}
          {step === 4 && (
            <div className="wiz-panel">
              <div className="wiz-head"><Palette size={17} /> Dizayn va tasdiq</div>
              <div className="wiz-sub">Shablonni tanlang va ma'lumotlarni tekshiring</div>
              <div className="form-group">
                <label>Dizayn shabloni</label>
                <select value={form.template} onChange={(e) => set("template", e.target.value)}>
                  {Object.entries(TEMPLATES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              <div className="review-box">
                <div className="review-row"><span className="rk"><Heart size={14} /> Kuyov-kelin</span><span className="rv">{form.groomName} & {form.brideName}</span></div>
                <div className="review-row"><span className="rk"><CalendarDays size={14} /> Sana</span><span className="rv">{fmtDate(form.weddingDate)} • {form.weddingTime}</span></div>
                <div className="review-row"><span className="rk"><MapPin size={14} /> Joy</span><span className="rv">{form.venueName || form.address || "—"}</span></div>
                <div className="review-row"><span className="rk"><Palette size={14} /> Shablon</span><span className="rv">{TEMPLATES[form.template]}</span></div>
                <div className="review-row"><span className="rk"><ImgIcon size={14} /> Rasmlar</span><span className="rv">{form.images.length} ta</span></div>
                {form.description && <div className="review-row"><span className="rk"><FileText size={14} /> Tavsif</span><span className="rv" style={{ maxWidth: 200, fontWeight: 400 }}>{form.description.slice(0, 60)}{form.description.length > 60 ? "…" : ""}</span></div>}
                {form.images.length > 0 && (
                  <div className="review-imgs">
                    {form.images.slice(0, 5).map((u) => <img key={u} src={u} alt="" />)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigatsiya tugmalari */}
          <div className="wiz-actions">
            {step > 1
              ? <button className="btn btn-ghost" onClick={back}><ArrowLeft size={16} /> Orqaga</button>
              : <button className="btn btn-ghost" onClick={() => setModal(false)}>Bekor qilish</button>}
            {step < 4
              ? <button className="btn btn-primary" onClick={next}>Keyingi <ArrowRight size={16} /></button>
              : <button className="btn btn-primary" onClick={save} disabled={saving || uploading}>
                  <Check size={16} /> {saving ? "Saqlanmoqda..." : "Saqlash"}
                </button>}
          </div>
        </Modal>
      )}
    </Layout>
  );
}
