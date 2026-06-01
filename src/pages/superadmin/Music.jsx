import { useEffect, useRef, useState } from "react";
import api from "../../api/client";
import { Layout, Modal } from "../../components/UI";
import { uploadFile, firebaseReady } from "../../api/firebase";
import {
  Plus, Pencil, Trash2, Music2, UploadCloud, Loader2, Play, Pause, AlertTriangle,
} from "lucide-react";

const emptyForm = { name: "", url: "", cover: "", order: 0, status: "active" };

export default function Music() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(null);
  const audioRef = useRef(null);
  const fileRef = useRef(null);

  const load = () => {
    setLoading(true);
    api.get("/admin/music").then((r) => setItems(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setError(""); setModal(true); };
  const openEdit = (m) => {
    setEditing(m);
    setForm({ name: m.name, url: m.url, cover: m.cover || "", order: m.order || 0, status: m.status });
    setError(""); setModal(true);
  };

  const pickAudio = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!firebaseReady) { setError("Firebase sozlanmagan (.env)."); return; }
    setUploading(true); setError("");
    try {
      const url = await uploadFile(file, "music");
      setForm((s) => ({ ...s, url, name: s.name || file.name.replace(/\.[^.]+$/, "") }));
    } catch (err) {
      setError("Yuklashda xato: " + err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    if (!form.name || !form.url) { setError("Nom va audio fayl majburiy."); return; }
    setSaving(true); setError("");
    try {
      if (editing) await api.put(`/admin/music/${editing._id}`, form);
      else await api.post("/admin/music", form);
      setModal(false); load();
    } catch (err) {
      setError(err.response?.data?.message || "Xatolik");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (m) => {
    if (!window.confirm(`"${m.name}" qo'shig'ini o'chirasizmi?`)) return;
    await api.delete(`/admin/music/${m._id}`);
    load();
  };

  const togglePlay = (m) => {
    if (playing === m._id) {
      audioRef.current?.pause();
      setPlaying(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = m.url;
        audioRef.current.play().catch(() => {});
      }
      setPlaying(m._id);
    }
  };

  return (
    <Layout title="Musiqa">
      <audio ref={audioRef} onEnded={() => setPlaying(null)} hidden />
      <div className="card">
        <div className="card-head">
          <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}><Music2 size={18} /> Fon musiqalari</h2>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={18} /> Yangi qo'shiq</button>
        </div>

        {loading ? (
          <div className="loading">Yuklanmoqda...</div>
        ) : items.length === 0 ? (
          <div className="empty">Hali musiqa yo'q. "Yangi qo'shiq" orqali MP3 yuklang.</div>
        ) : (
          <table>
            <thead>
              <tr><th>#</th><th>Nomi</th><th>Holat</th><th>Tartib</th><th>Amallar</th></tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m._id}>
                  <td>
                    <button className="icon-btn" onClick={() => togglePlay(m)} title="Tinglash">
                      {playing === m._id ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                  </td>
                  <td style={{ fontWeight: 600 }}>{m.name}</td>
                  <td><span className={`badge ${m.status}`}>{m.status === "active" ? "Aktiv" : "Nofaol"}</span></td>
                  <td>{m.order}</td>
                  <td>
                    <button className="icon-btn" onClick={() => openEdit(m)} title="Tahrirlash"><Pencil size={16} /></button>
                    <button className="icon-btn del" onClick={() => remove(m)} title="O'chirish"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal title={editing ? "Qo'shiqni tahrirlash" : "Yangi qo'shiq"} onClose={() => setModal(false)}>
          {error && <div className="error-msg">{error}</div>}

          <div className="dropzone" onClick={() => !uploading && fileRef.current?.click()}>
            <div className="dz-ic"><UploadCloud size={24} /></div>
            {uploading ? (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Loader2 size={16} className="spin" /> Yuklanmoqda...</div>
            ) : form.url ? (
              <>
                <div className="dz-title">✓ Audio yuklandi</div>
                <div className="dz-hint">Boshqa fayl tanlash uchun bosing</div>
              </>
            ) : (
              <>
                <div className="dz-title">MP3 tanlash</div>
                <div className="dz-hint">Audio fayl (mp3, m4a...)</div>
              </>
            )}
            <input ref={fileRef} type="file" accept="audio/*" hidden onChange={pickAudio} />
          </div>
          {!firebaseReady && (
            <span className="hint-warn" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <AlertTriangle size={13} /> Firebase sozlanmagan (.env)
            </span>
          )}

          <div className="form-group" style={{ marginTop: 14 }}>
            <label>Qo'shiq nomi *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Masalan: Romantik fon" />
          </div>
          <div className="form-group">
            <label>Audio URL (yoki tashqi havola)</label>
            <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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

          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setModal(false)}>Bekor qilish</button>
            <button className="btn btn-primary" onClick={save} disabled={saving || uploading}>
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
