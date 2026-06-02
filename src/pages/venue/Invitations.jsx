import { useEffect, useState, useRef } from "react";
import api, { shareLink } from "../../api/client";
import { Layout, Modal } from "../../components/UI";
import FloatingHearts from "../../components/FloatingHearts";
import {
  Plus, Pencil, Link2, Heart, MapPin, CalendarDays,
  ArrowLeft, ArrowRight, Check, Palette, Image as ImgIcon,
  AlertTriangle, Music2, Play, Pause, Lock, Send, Sparkles, CheckCircle2,
} from "lucide-react";

const emptyForm = {
  groomName: "", brideName: "", weddingDate: "", weddingTime: "18:00",
  description: "", design: "", music: "",
};

const DESC_EXAMPLE =
  "Mehmonlarga qisqa so'z (ixtiyoriy). Masalan: Sizni shu quvonchli kunimizda ko'rishdan mamnun bo'lamiz.";

const STEPS = [
  { n: 1, label: "Asosiy", Icon: Heart },
  { n: 2, label: "Dizayn", Icon: Palette },
  { n: 3, label: "Musiqa", Icon: Music2 },
  { n: 4, label: "Yuborish", Icon: Send },
];

export default function Invitations() {
  const [list, setList] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [music, setMusic] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false); // yuborilgandan keyingi tabrik ekrani
  // Yuborilgan taklifnoma uchun cheklangan tahrir (faqat ism + soat)
  const [sentEdit, setSentEdit] = useState(null);
  const [previewMusic, setPreviewMusic] = useState(null);
  const audioRef = useRef(null);

  const load = () => {
    setLoading(true);
    api.get("/venue/invitations").then((r) => setList(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);
  useEffect(() => {
    api.get("/designs").then((r) => setDesigns(r.data)).catch(() => {});
    api.get("/music").then((r) => setMusic(r.data)).catch(() => {});
  }, []);

  const openCreate = () => { setForm(emptyForm); setStep(1); setSent(false); setModal(true); };
  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

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

  // YUBORISH — yaratiladi va DARHOL yuboriladi (qoralama yo'q, hisobga olinadi)
  const submit = async () => {
    setSaving(true);
    try {
      const payload = { ...form, design: form.design || null, music: form.music || null, send: true };
      await api.post("/venue/invitations", payload);
      setSent(true);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Yuborishda xatolik");
    } finally {
      setSaving(false);
    }
  };

  const copyLink = (inv) => {
    const url = shareLink(inv._id);
    navigator.clipboard.writeText(url);
    alert("Havola nusxalandi:\n" + url);
  };

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
      <div className="fixed inset-0 -z-10 pointer-events-none bg-gradient-to-br from-gold-50 via-white to-gold-100" />
      <FloatingHearts count={12} />
      <audio ref={audioRef} onEnded={() => setPreviewMusic(null)} hidden />

      <div className="relative z-10 animate-fadeUp">
        {/* Premium sarlavha + CTA */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 rounded-2xl
                        bg-gradient-to-br from-[#3a2a17] to-[#875328] text-white px-6 py-5 shadow-premium">
          <div>
            <div className="inline-flex items-center gap-2 text-gold-200 text-xs font-semibold tracking-widest uppercase">
              <Sparkles size={14} /> Mening taklifnomalarim
            </div>
            <h2 className="font-serif text-2xl font-bold mt-1">Har bir to'y — alohida hikoya</h2>
          </div>
          <button onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-full bg-white text-gold-800 font-semibold
                       px-5 py-2.5 shadow-gold hover:scale-[1.03] active:scale-95 transition-transform">
            <Plus size={18} /> Yangi taklifnoma
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gold-500">Yuklanmoqda...</div>
        ) : list.length === 0 ? (
          <div className="rounded-2xl bg-white/85 border border-gold-100 shadow-premium py-16 text-center text-gold-500">
            <Heart size={36} className="mx-auto mb-3 text-rose-300" />
            Hali taklifnoma yo'q. <b className="text-gold-800">"Yangi taklifnoma"</b> orqali birinchisini yarating.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((inv) => (
              <div key={inv._id}
                className="group rounded-2xl overflow-hidden bg-white/90 backdrop-blur border border-gold-100
                           shadow-premium hover:-translate-y-1 transition-transform">
                <div className="relative h-40 bg-gold-100">
                  {inv.images?.[0]
                    ? <img src={inv.images[0]} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><ImgIcon size={30} className="text-gold-300" /></div>}
                  <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full
                                   bg-emerald-500 text-white text-[11px] font-semibold px-2.5 py-1 shadow">
                    <CheckCircle2 size={12} /> Yuborilgan
                  </span>
                </div>
                <div className="p-4">
                  <div className="font-serif text-lg font-bold text-gold-900 flex items-center gap-1.5">
                    <Heart size={15} className="text-rose-500" /> {inv.groomName} & {inv.brideName}
                  </div>
                  <div className="text-xs text-gold-500 flex items-center gap-1 mt-1">
                    <CalendarDays size={13} /> {fmtDate(inv.weddingDate)} • {inv.weddingTime}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button onClick={() => copyLink(inv)} title="Havola"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gold-50 hover:bg-gold-100 text-gold-700 text-sm font-medium px-3 py-1.5">
                      <Link2 size={15} /> Havola
                    </button>
                    {inv.venueEditUsed ? (
                      <span className="inline-flex items-center gap-1 text-xs text-gold-400">
                        <Lock size={13} /> tahrir tugagan
                      </span>
                    ) : (
                      <button onClick={() => openSentEdit(inv)} title="Ism va soatni tahrirlash (1 marta)"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gold-50 hover:bg-gold-100 text-gold-700 text-sm font-medium px-3 py-1.5">
                        <Pencil size={15} /> Tahrir
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== YARATISH + YUBORISH (wizard) ===== */}
      {modal && (
        <Modal title={sent ? "Tayyor!" : "Yangi taklifnoma"} onClose={() => setModal(false)}>
          {sent ? (
            <div className="text-center py-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <CheckCircle2 size={34} className="text-emerald-600" />
              </div>
              <h3 className="font-serif text-xl font-bold text-gold-900">Taklifnoma yuborildi! 🎉</h3>
              <p className="text-sm text-gold-500 mt-1.5 max-w-xs mx-auto">
                Taklifnoma hisobga olindi va Telegram orqali sizga yetkazildi.
              </p>
              <button className="btn btn-primary mt-5" onClick={() => setModal(false)}>Yopish</button>
            </div>
          ) : (
            <>
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
                  <div className="wiz-sub">Ixtiyoriy — taklifnoma ochilganda avtomatik ijro etiladi</div>
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

              {/* 4: Yuborish */}
              {step === 4 && (
                <div className="wiz-panel">
                  <div className="wiz-head"><Send size={17} /> Yuborish</div>
                  <div className="wiz-sub">Ma'lumotlarni tekshiring va yuboring</div>

                  <div className="form-group">
                    <label>Qisqa matn (ixtiyoriy)</label>
                    <textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder={DESC_EXAMPLE} />
                  </div>

                  <div className="review-box">
                    <div className="review-row"><span className="rk"><Heart size={14} /> Kuyov-kelin</span><span className="rv">{form.groomName} & {form.brideName}</span></div>
                    <div className="review-row"><span className="rk"><CalendarDays size={14} /> Sana</span><span className="rv">{fmtDate(form.weddingDate)} • {form.weddingTime}</span></div>
                    <div className="review-row"><span className="rk"><Palette size={14} /> Dizayn</span><span className="rv">{designName(form.design)}</span></div>
                    <div className="review-row"><span className="rk"><Music2 size={14} /> Musiqa</span><span className="rv">{form.music ? musicName(form.music) : "Musiqasiz"}</span></div>
                  </div>
                </div>
              )}

              <div className="wiz-actions">
                {step > 1
                  ? <button className="btn btn-ghost" onClick={back}><ArrowLeft size={16} /> Orqaga</button>
                  : <button className="btn btn-ghost" onClick={() => setModal(false)}>Bekor qilish</button>}
                {step < 4
                  ? <button className="btn btn-primary" onClick={next}>Keyingi <ArrowRight size={16} /></button>
                  : <button className="btn btn-primary" onClick={submit} disabled={saving}>
                      <Send size={16} /> {saving ? "Yuborilmoqda..." : "Yuborish"}
                    </button>}
              </div>
            </>
          )}
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
