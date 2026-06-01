import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/client";
import { Layout } from "../../components/UI";
import { uploadFile, firebaseReady } from "../../api/firebase";
import {
  ArrowLeft, Save, UploadCloud, X, Loader2, Heart, MapPin, Palette, Music2, ImageIcon, ExternalLink,
} from "lucide-react";

export default function EditInvitation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [designs, setDesigns] = useState([]);
  const [music, setMusic] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    Promise.all([
      api.get(`/admin/invitations/${id}`),
      api.get("/admin/designs"),
      api.get("/admin/music"),
    ])
      .then(([inv, d, m]) => {
        const v = inv.data;
        setForm({
          groomName: v.groomName || "", brideName: v.brideName || "",
          weddingDate: v.weddingDate?.slice(0, 10) || "", weddingTime: v.weddingTime || "18:00",
          venueName: v.venueName || "", address: v.address || "", mapLink: v.mapLink || "",
          description: v.description || "",
          design: v.design?._id || v.design || "", music: v.music?._id || v.music || "",
          images: v.images || [],
          _meta: { venue: v.venue, status: v.status, acceptStatus: v.acceptStatus },
        });
        setDesigns(d.data); setMusic(m.data);
      })
      .catch(() => setMsg("Taklifnoma yuklanmadi"))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const onPick = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (!firebaseReady) { setMsg("Firebase sozlanmagan (.env)."); return; }
    setUploading(true);
    try {
      const urls = [];
      for (const f of files) urls.push(await uploadFile(f));
      setForm((s) => ({ ...s, images: [...s.images, ...urls] }));
    } catch (err) {
      setMsg("Rasm yuklashda xato: " + err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    setSaving(true); setMsg("");
    try {
      await api.put(`/admin/invitations/${id}`, {
        groomName: form.groomName, brideName: form.brideName,
        weddingDate: form.weddingDate, weddingTime: form.weddingTime,
        venueName: form.venueName, address: form.address, mapLink: form.mapLink,
        description: form.description,
        design: form.design || null, music: form.music || null,
        images: form.images,
      });
      setMsg("✓ Saqlandi");
    } catch (err) {
      setMsg(err.response?.data?.message || "Xatolik");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout title="Taklifnomani tahrirlash"><div className="loading">Yuklanmoqda...</div></Layout>;
  if (!form) return <Layout title="Taklifnomani tahrirlash"><div className="empty">{msg || "Topilmadi"}</div></Layout>;

  return (
    <Layout title="Taklifnomani tahrirlash (Bosh admin)">
      <div className="card">
        <div className="card-head">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Orqaga</button>
          <a className="btn btn-ghost btn-sm" href={`/i/${id}`} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Ko'rish</a>
        </div>

        <div className="form-note" style={{ marginBottom: 14 }}>
          To'yxona: <b>{form._meta.venue?.name || "—"}</b> • Holat: <b>{form._meta.status}</b> / {form._meta.acceptStatus}
        </div>

        <div className="wiz-head"><Heart size={17} /> Asosiy</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="form-group"><label>Kuyov ismi</label><input value={form.groomName} onChange={(e) => set("groomName", e.target.value)} /></div>
          <div className="form-group"><label>Kelin ismi</label><input value={form.brideName} onChange={(e) => set("brideName", e.target.value)} /></div>
          <div className="form-group"><label>To'y sanasi</label><input type="date" value={form.weddingDate} onChange={(e) => set("weddingDate", e.target.value)} /></div>
          <div className="form-group"><label>Vaqti</label><input type="time" value={form.weddingTime} onChange={(e) => set("weddingTime", e.target.value)} /></div>
        </div>

        <div className="wiz-head" style={{ marginTop: 10 }}><MapPin size={17} /> Joylashuv</div>
        <div className="form-group"><label>To'yxona nomi</label><input value={form.venueName} onChange={(e) => set("venueName", e.target.value)} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="form-group"><label>Manzil</label><input value={form.address} onChange={(e) => set("address", e.target.value)} /></div>
          <div className="form-group"><label>Google Map havolasi</label><input value={form.mapLink} onChange={(e) => set("mapLink", e.target.value)} /></div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="form-group">
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}><Palette size={15} /> Dizayn</label>
            <select value={form.design} onChange={(e) => set("design", e.target.value)}>
              <option value="">— yo'q —</option>
              {designs.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}><Music2 size={15} /> Musiqa</label>
            <select value={form.music} onChange={(e) => set("music", e.target.value)}>
              <option value="">— yo'q —</option>
              {music.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group"><label>Batafsil ma'lumot</label><textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} /></div>

        <div className="wiz-head" style={{ marginTop: 10 }}><ImageIcon size={17} /> Rasmlar</div>
        <div className="dropzone" onClick={() => !uploading && fileRef.current?.click()}>
          <div className="dz-ic"><UploadCloud size={24} /></div>
          {uploading ? <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}><Loader2 size={16} className="spin" /> Yuklanmoqda...</div> : <div className="dz-title">Rasm qo'shish</div>}
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onPick} />
        </div>
        {form.images.length > 0 && (
          <div className="thumb-grid">
            {form.images.map((url) => (
              <div key={url} className="thumb">
                <img src={url} alt="" />
                <button type="button" className="thumb-x" onClick={() => set("images", form.images.filter((u) => u !== url))}><X size={14} /></button>
              </div>
            ))}
          </div>
        )}

        <div className="modal-actions" style={{ marginTop: 18, alignItems: "center" }}>
          {msg && <span style={{ color: msg.startsWith("✓") ? "var(--green)" : "var(--orange)", fontWeight: 600 }}>{msg}</span>}
          <button className="btn btn-primary" onClick={save} disabled={saving || uploading}>
            <Save size={16} /> {saving ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>
      </div>
    </Layout>
  );
}
