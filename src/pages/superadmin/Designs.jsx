import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../api/client";
import { Layout, Modal } from "../../components/UI";
import { uploadFile, firebaseReady } from "../../api/firebase";
import { buildPreviewDoc } from "../../lib/design";
import {
  Plus, Pencil, Trash2, Palette, UploadCloud, Loader2, Eye, Info, AlertTriangle,
} from "lucide-react";

const emptyForm = { name: "", key: "", preview: "", html: "", css: "", defaultMusic: "", order: 0, status: "active" };

const STARTER_HTML = `<section class="hero">
  <div data-toy="cover" class="cover"></div>
  <div class="hero-inner">
    <div class="eyebrow">BIZNING TO'YIMIZ</div>
    <h1>{{groomName}} <span>&amp;</span> {{brideName}}</h1>
    <div class="date">{{weddingDate}} • {{weddingTime}}</div>
    <div class="venue">{{venueName}}</div>
    <div data-toy="countdown"></div>
  </div>
</section>

<section class="block">
  <h2>Galereya</h2>
  <div data-toy="gallery"></div>
</section>

<section class="block">
  <h2>Manzil</h2>
  <p>{{address}}</p>
  <div data-toy="map"></div>
</section>`;

const STARTER_CSS = `body{background:#faf6ef;color:#5b4a32;text-align:center}
.hero{position:relative;min-height:100vh;display:flex;align-items:center;justify-content:center;overflow:hidden}
.cover{position:absolute;inset:0;opacity:.25}
.hero-inner{position:relative;padding:30px}
.eyebrow{letter-spacing:4px;font-size:12px;color:#b08d57}
h1{font-family:'Great Vibes',cursive;font-size:64px;margin:14px 0;font-weight:400}
h1 span{font-size:.5em;opacity:.6}
.date{font-size:18px}
.venue{margin-top:6px;color:#a8916b}
[data-toy="countdown"]{margin-top:34px}
.block{max-width:640px;margin:0 auto;padding:50px 22px}
.block h2{font-family:'Cormorant Garamond',serif;font-size:30px;color:#b08d57}`;

const sampleInv = {
  groomName: "Umid",
  brideName: "Maftuna",
  weddingTime: "18:00",
  venueName: "Bahor To'yxonasi",
  address: "Toshkent sh., Chilonzor t.",
  mapLink: "https://maps.google.com",
  description: "Sizni to'yimizga taklif qilamiz!",
  // sana: 40 kundan keyin (countdown jonli ko'rinishi uchun)
  weddingDate: new Date(Date.now() + 40 * 86400000).toISOString(),
};

export default function Designs() {
  const [list, setList] = useState([]);
  const [music, setMusic] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const fileRef = useRef(null);

  const load = () => {
    setLoading(true);
    Promise.all([api.get("/admin/designs"), api.get("/admin/music")])
      .then(([d, m]) => { setList(d.data); setMusic(m.data); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, html: STARTER_HTML, css: STARTER_CSS });
    setError(""); setModal(true);
  };
  const openEdit = (d) => {
    setEditing(d);
    setForm({
      name: d.name, key: d.key, preview: d.preview || "", html: d.html || "", css: d.css || "",
      defaultMusic: d.defaultMusic?._id || d.defaultMusic || "", order: d.order || 0, status: d.status,
    });
    setError(""); setModal(true);
  };

  const pickPreview = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!firebaseReady) { setError("Firebase sozlanmagan (.env)."); return; }
    setUploading(true); setError("");
    try {
      const url = await uploadFile(file, "design-previews");
      setForm((s) => ({ ...s, preview: url }));
    } catch (err) {
      setError("Yuklashda xato: " + err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    if (!form.name) { setError("Dizayn nomi majburiy."); return; }
    setSaving(true); setError("");
    const payload = { ...form, defaultMusic: form.defaultMusic || null };
    try {
      if (editing) await api.put(`/admin/designs/${editing._id}`, payload);
      else await api.post("/admin/designs", payload);
      setModal(false); load();
    } catch (err) {
      setError(err.response?.data?.message || "Xatolik");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (d) => {
    if (!window.confirm(`"${d.name}" dizaynini o'chirasizmi?`)) return;
    await api.delete(`/admin/designs/${d._id}`);
    load();
  };

  const previewDoc = useMemo(
    () => buildPreviewDoc({ html: form.html, css: form.css }, { ...sampleInv, images: form.preview ? [form.preview] : [] }),
    [form.html, form.css, form.preview]
  );

  return (
    <Layout title="Dizaynlar">
      <div className="card">
        <div className="card-head">
          <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}><Palette size={18} /> Taklifnoma dizaynlari</h2>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={18} /> Yangi dizayn</button>
        </div>

        {loading ? (
          <div className="loading">Yuklanmoqda...</div>
        ) : list.length === 0 ? (
          <div className="empty">Hali dizayn yo'q. "Yangi dizayn" orqali HTML/CSS kod kiriting.</div>
        ) : (
          <div className="design-grid">
            {list.map((d) => (
              <div key={d._id} className="design-card">
                <div className="design-thumb">
                  {d.preview ? <img src={d.preview} alt={d.name} /> : <div className="design-thumb-empty"><Palette size={28} /></div>}
                  <span className={`badge ${d.status} float`}>{d.status === "active" ? "Aktiv" : "Nofaol"}</span>
                </div>
                <div className="design-body">
                  <div className="design-name">{d.name}</div>
                  <div className="design-key">key: {d.key}</div>
                  <div className="inv-actions">
                    <button className="icon-btn" onClick={() => openEdit(d)} title="Tahrirlash"><Pencil size={16} /></button>
                    <button className="icon-btn del" onClick={() => remove(d)} title="O'chirish"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <Modal title={editing ? "Dizaynni tahrirlash" : "Yangi dizayn"} onClose={() => setModal(false)}>
          {error && <div className="error-msg">{error}</div>}

          <div className="placeholder-help">
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, marginBottom: 6 }}>
              <Info size={15} /> Placeholder'lar
            </div>
            <code>{`{{groomName}} {{brideName}} {{weddingDate}} {{weddingTime}} {{venueName}} {{address}} {{description}} {{mapLink}}`}</code>
            <div style={{ marginTop: 6 }}>Widget'lar (bo'sh div):</div>
            <code>{`<div data-toy="cover"></div>  <div data-toy="countdown"></div>  <div data-toy="gallery"></div>  <div data-toy="map"></div>`}</code>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label>Dizayn nomi *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Masalan: Royal Gold" />
            </div>
            <div className="form-group">
              <label>Kalit (key){editing ? "" : " — bo'sh qoldirsangiz nomdan yaratiladi"}</label>
              <input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="royal-gold" />
            </div>
          </div>

          <div className="form-group">
            <label>Preview rasm (tanlash kartochkasi + Telegram og:image)</label>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 size={14} className="spin" /> : <UploadCloud size={14} />} Rasm yuklash
              </button>
              {form.preview && <img src={form.preview} alt="" style={{ height: 40, borderRadius: 8 }} />}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickPreview} />
            </div>
            {!firebaseReady && <span className="hint-warn" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><AlertTriangle size={13} /> Firebase sozlanmagan</span>}
          </div>

          <div className="form-group">
            <label>HTML kod</label>
            <textarea className="code-area" rows={10} value={form.html} onChange={(e) => setForm({ ...form, html: e.target.value })} spellCheck={false} />
          </div>
          <div className="form-group">
            <label>CSS kod</label>
            <textarea className="code-area" rows={8} value={form.css} onChange={(e) => setForm({ ...form, css: e.target.value })} spellCheck={false} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label>Default musiqa</label>
              <select value={form.defaultMusic} onChange={(e) => setForm({ ...form, defaultMusic: e.target.value })}>
                <option value="">— yo'q —</option>
                {music.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Tartib</label>
              <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
            </div>
            <div className="form-group">
              <label>Holat</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Aktiv</option>
                <option value="inactive">Nofaol</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={() => setShowPreview((v) => !v)}>
              <Eye size={15} /> Jonli ko'rinish {showPreview ? "(yashirish)" : "(ko'rsatish)"}
            </label>
            {showPreview && (
              <iframe title="preview" className="design-preview-frame" srcDoc={previewDoc} sandbox="allow-scripts allow-popups" />
            )}
          </div>

          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setModal(false)}>Bekor qilish</button>
            <button className="btn btn-primary" onClick={save} disabled={saving || uploading}>{saving ? "Saqlanmoqda..." : "Saqlash"}</button>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
