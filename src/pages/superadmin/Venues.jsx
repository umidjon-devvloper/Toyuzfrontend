import { useEffect, useState } from "react";
import api from "../../api/client";
import { Layout, Modal, fmt } from "../../components/UI";
import {
  Search, Plus, Pencil, Trash2, Check, Copy, RefreshCw,
  CheckCircle2, AlertTriangle,
} from "lucide-react";

const emptyForm = {
  name: "", login: "", password: "", pricePerInvitation: 200000,
  phone: "", address: "", status: "active", telegramChatId: "",
};

export default function Venues() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [createdPass, setCreatedPass] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    api.get("/admin/venues")
      .then((r) => setVenues(r.data))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openCreate = () => {
    setEditing(null); setForm(emptyForm); setCreatedPass(null); setError(""); setModal(true);
  };
  const openEdit = (v) => {
    setEditing(v);
    setForm({
      name: v.name, login: v.admin?.login || "", password: "",
      pricePerInvitation: v.pricePerInvitation, phone: v.phone || "",
      address: v.address || "", status: v.status, telegramChatId: v.telegramChatId || "",
    });
    setCreatedPass(null); setError(""); setModal(true);
  };

  const randomPass = () => {
    const c = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let p = ""; for (let i = 0; i < 10; i++) p += c[Math.floor(Math.random() * c.length)];
    setForm({ ...form, password: p });
  };

  const save = async () => {
    setError("");
    try {
      if (editing) {
        await api.put(`/admin/venues/${editing._id}`, {
          name: form.name, pricePerInvitation: Number(form.pricePerInvitation),
          phone: form.phone, address: form.address, status: form.status,
          newPassword: form.password || undefined, telegramChatId: form.telegramChatId,
        });
        setModal(false); load();
      } else {
        const { data } = await api.post("/admin/venues", {
          ...form, pricePerInvitation: Number(form.pricePerInvitation),
        });
        setCreatedPass(data.plainPassword);
        load();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Xatolik");
    }
  };

  const remove = async (v) => {
    if (!window.confirm(`"${v.name}" to'yxonasini o'chirasizmi? Barcha taklifnomalar ham o'chadi.`)) return;
    await api.delete(`/admin/venues/${v._id}`);
    load();
  };

  const filtered = venues.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    (v.admin?.login || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title="To'yxonalar">
      <div className="card">
        <div className="card-head">
          <div className="search-box">
            <Search size={16} /> <input placeholder="Qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={18} /> Yangi to'yxona qo'shish</button>
        </div>

        {loading ? (
          <div className="loading">Yuklanmoqda...</div>
        ) : filtered.length === 0 ? (
          <div className="empty">To'yxona topilmadi. Yangi qo'shing.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>To'yxona nomi</th><th>Login</th><th>Narx / taklif</th>
                <th>Yuborilgan</th><th>Qarzi</th><th>Telegram</th><th>Holat</th><th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v._id}>
                  <td style={{ fontWeight: 600 }}>{v.name}</td>
                  <td>{v.admin?.login}</td>
                  <td>{fmt(v.pricePerInvitation)} so'm</td>
                  <td>{v.sentCount}</td>
                  <td style={{ color: v.debt > 0 ? "var(--orange)" : "var(--green)", fontWeight: 600 }}>
                    {fmt(v.debt)} so'm
                  </td>
                  <td>
                    {v.telegramChatId
                      ? <span className="badge accepted" title={`chat: ${v.telegramChatId}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Check size={12} /> Ulangan</span>
                      : <span className="badge draft">Ulanmagan</span>}
                  </td>
                  <td><span className={`badge ${v.status}`}>{v.status === "active" ? "Aktiv" : "Nofaol"}</span></td>
                  <td>
                    <button className="icon-btn" onClick={() => openEdit(v)} title="Tahrirlash"><Pencil size={16} /></button>
                    <button className="icon-btn del" onClick={() => remove(v)} title="O'chirish"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal
          title={editing ? "To'yxonani tahrirlash" : "Yangi to'yxona qo'shish"}
          onClose={() => setModal(false)}
        >
          {error && <div className="error-msg">{error}</div>}

          {createdPass ? (
            <div>
              <div style={{ color: "var(--green)", fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={18} /> To'yxona muvaffaqiyatli yaratildi!
              </div>
              <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
                Login: <b>{form.login}</b>
              </p>
              <div className="password-box">
                <span>{createdPass}</span>
                <button className="btn btn-sm btn-ghost" onClick={() => navigator.clipboard.writeText(createdPass)}>
                  <Copy size={14} /> Nusxa
                </button>
              </div>
              <p style={{ fontSize: 12, color: "var(--orange)", marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <AlertTriangle size={14} /> Bu parolni saqlab oling — qayta ko'rsatilmaydi!
              </p>
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={() => setModal(false)}>Yopish</button>
              </div>
            </div>
          ) : (
            <>
              <div className="form-group">
                <label>To'yxona nomi *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Masalan: Omad To'yxonasi" />
              </div>
              {!editing && (
                <div className="form-group">
                  <label>Login *</label>
                  <input value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })}
                    placeholder="omad" />
                </div>
              )}
              <div className="form-group">
                <label>{editing ? "Yangi parol (bo'sh qoldirsangiz o'zgarmaydi)" : "Parol"}</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder={editing ? "O'zgartirmaslik uchun bo'sh qoldiring" : "Avtomatik yaratiladi"} />
                  <button className="btn btn-ghost btn-sm" onClick={randomPass} title="Tasodifiy parol"><RefreshCw size={15} /></button>
                </div>
              </div>
              <div className="form-group">
                <label>Bitta taklifnoma narxi (so'm) *</label>
                <input type="number" value={form.pricePerInvitation}
                  onChange={(e) => setForm({ ...form, pricePerInvitation: e.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label>Telefon</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
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
                <label>Manzil</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              {editing && (
                <div className="form-group">
                  <label>Telegram chat ID (ixtiyoriy — qo'lda ulash)</label>
                  <input value={form.telegramChatId}
                    onChange={(e) => setForm({ ...form, telegramChatId: e.target.value })}
                    placeholder="Masalan: 123456789 (yoki bo'sh qoldiring)" />
                  <span className="hint">
                    Odatda to'yxona bot'ga login/parol bilan kirsa avtomatik ulanadi. Bu yerda qo'lda ham kiritsa bo'ladi.
                  </span>
                </div>
              )}
              <div className="modal-actions">
                <button className="btn btn-ghost" onClick={() => setModal(false)}>Bekor qilish</button>
                <button className="btn btn-primary" onClick={save}>Saqlash</button>
              </div>
            </>
          )}
        </Modal>
      )}
    </Layout>
  );
}
