import { useEffect, useState } from "react";
import api from "../../api/client";
import { Layout, Modal, fmt, monthName } from "../../components/UI";
import {
  CheckCircle2, Clock, Plus, Minus, Trash2, Wallet, CalendarHeart, Send, Sparkles,
} from "lucide-react";

export default function Billing() {
  const [venues, setVenues] = useState([]);
  const [selected, setSelected] = useState(null);
  const [billing, setBilling] = useState(null);
  const [adjust, setAdjust] = useState("");

  const loadVenues = () => api.get("/admin/venues").then((r) => setVenues(r.data));
  useEffect(() => { loadVenues(); }, []);

  const openBilling = async (v) => {
    setSelected(v);
    setAdjust("");
    const { data } = await api.get(`/admin/venues/${v._id}/billing`);
    setBilling(data);
  };
  const refresh = async () => {
    await loadVenues();
    if (selected) {
      const { data } = await api.get(`/admin/venues/${selected._id}/billing`);
      setBilling(data);
      const fresh = (await api.get("/admin/venues")).data.find((x) => x._id === selected._id);
      if (fresh) setSelected(fresh);
    }
  };

  const payMonth = async (y, m) => {
    if (!window.confirm(`${monthName(m)} ${y} oyini to'langan deb belgilaysizmi?`)) return;
    await api.put(`/admin/venues/${selected._id}/pay-month`, { year: y, month: m });
    refresh();
  };
  const togglePay = async (inv) => {
    await api.put(`/admin/invitations/${inv._id}/pay`, { isPaid: !inv.isPaid });
    refresh();
  };

  // Qo'lda qarz tuzatmasi (+ / −)
  const applyAdjust = async (sign) => {
    const amount = Number(adjust);
    if (!amount) return;
    await api.put(`/admin/venues/${selected._id}/adjust-debt`, { delta: sign * Math.abs(amount) });
    setAdjust("");
    refresh();
  };
  const resetManual = async () => {
    if (!window.confirm("Qo'lda tuzatmani 0 ga qaytarasizmi?")) return;
    await api.put(`/admin/venues/${selected._id}/adjust-debt`, { set: 0 });
    refresh();
  };

  // To'langan taklifnomalarni o'chirish (tozalash) — qarzdorlar qoladi
  const deletePaid = async (monthRef) => {
    const scope = monthRef ? `${monthName(monthRef.m)} ${monthRef.y} oyidagi` : "barcha";
    if (!window.confirm(`${scope} TO'LANGAN taklifnomalarni o'chirasizmi? Bu amalni qaytarib bo'lmaydi. Qarzdorlar qoladi.`)) return;
    await api.delete(`/admin/venues/${selected._id}/paid-invitations`, { data: monthRef ? { year: monthRef.y, month: monthRef.m } : {} });
    refresh();
  };

  return (
    <Layout title="Hisob-kitob va qarzlar">
      <div className="card">
        <div className="card-head"><h2>To'yxonalar bo'yicha qarz</h2></div>
        <table>
          <thead>
            <tr>
              <th>To'yxona</th><th>Narx/taklif</th><th>Yuborilgan</th>
              <th>Tugagan to'y</th><th>Qarzi</th><th></th>
            </tr>
          </thead>
          <tbody>
            {venues.map((v) => (
              <tr key={v._id}>
                <td style={{ fontWeight: 600 }}>{v.name}</td>
                <td>{fmt(v.pricePerInvitation)} so'm</td>
                <td>{v.sentCount} ta</td>
                <td>{v.finishedCount ?? 0} ta</td>
                <td style={{ color: v.debt > 0 ? "var(--orange)" : "var(--green)", fontWeight: 600 }}>
                  {fmt(v.debt)} so'm
                  {v.manualDebt ? <span style={{ fontSize: 11, color: "var(--text-muted)" }}> (tuzatma: {fmt(v.manualDebt)})</span> : null}
                </td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => openBilling(v)}>Batafsil</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && billing && (
        <Modal title={`${selected.name} — qarz boshqaruvi`} onClose={() => { setSelected(null); setBilling(null); }}>
          {/* ===== Tezkor ko'rsatkichlar ===== */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
            <div className="mini-stat"><Send size={15} /><b>{selected.sentCount}</b><span>Yuborilgan</span></div>
            <div className="mini-stat"><CalendarHeart size={15} /><b>{selected.finishedCount ?? 0}</b><span>Tugagan to'y</span></div>
            <div className="mini-stat danger"><Wallet size={15} /><b>{fmt(selected.debt)}</b><span>Umumiy qarz</span></div>
          </div>

          {/* ===== Qo'lda qarz tuzatmasi (+ / −) ===== */}
          <div className="adjust-box">
            <div className="adjust-title"><Sparkles size={15} /> Qo'lda qarz tuzatmasi</div>
            <div className="adjust-sub">
              Joriy tuzatma: <b style={{ color: selected.manualDebt ? "var(--orange)" : "var(--green)" }}>{fmt(selected.manualDebt || 0)} so'm</b>.
              Qisman to'lov yoki kelishuv bo'lsa — bu yerda kamaytiring/oshiring.
            </div>
            <div className="adjust-row">
              <input
                type="number" placeholder="Summa (so'm)" value={adjust}
                onChange={(e) => setAdjust(e.target.value)}
              />
              <button className="btn btn-sm" style={{ background: "var(--green)", color: "#fff" }} onClick={() => applyAdjust(-1)} title="Qarzdan ayirish">
                <Minus size={15} /> Kamaytirish
              </button>
              <button className="btn btn-sm" style={{ background: "var(--orange)", color: "#fff" }} onClick={() => applyAdjust(1)} title="Qarzga qo'shish">
                <Plus size={15} /> Qo'shish
              </button>
            </div>
            <div className="adjust-quick">
              <button className="chip" onClick={() => setAdjust(String(selected.pricePerInvitation))}>1 taklif narxi</button>
              {selected.manualDebt ? <button className="chip" onClick={resetManual}>Tuzatmani 0 ga</button> : null}
            </div>
          </div>

          {/* ===== Oylar bo'yicha ===== */}
          <h3 style={{ fontSize: 15, margin: "18px 0 12px" }}>Oylar bo'yicha</h3>
          {billing.byMonth.length === 0 ? (
            <div className="empty">Hali yuborilgan taklifnoma yo'q</div>
          ) : (
            <table style={{ marginBottom: 20 }}>
              <thead>
                <tr><th>Oy</th><th>Soni</th><th>Summa</th><th>Qarz</th><th></th></tr>
              </thead>
              <tbody>
                {billing.byMonth.map((m, i) => (
                  <tr key={i}>
                    <td>{monthName(m._id.m)} {m._id.y}</td>
                    <td>{m.count} ta</td>
                    <td>{fmt(m.total)}</td>
                    <td style={{ color: m.unpaid > 0 ? "var(--orange)" : "var(--green)", fontWeight: 600 }}>{fmt(m.unpaid)}</td>
                    <td style={{ display: "flex", gap: 6 }}>
                      {m.unpaid > 0 && (
                        <button className="btn btn-sm btn-primary" onClick={() => payMonth(m._id.y, m._id.m)}>To'landi</button>
                      )}
                      {m.paid > 0 && (
                        <button className="btn btn-sm btn-ghost" title="Bu oydagi to'langanlarni o'chirish"
                          onClick={() => deletePaid({ y: m._id.y, m: m._id.m })}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* ===== Taklifnomalar ro'yxati ===== */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontSize: 15 }}>Taklifnomalar ro'yxati</h3>
            <button className="btn btn-sm btn-ghost" onClick={() => deletePaid(null)} title="Barcha to'langan taklifnomalarni o'chirish">
              <Trash2 size={14} /> To'langanlarni tozalash
            </button>
          </div>
          <table>
            <thead>
              <tr><th>Kuyov-Kelin</th><th>Sana</th><th>Narx</th><th>To'lov</th></tr>
            </thead>
            <tbody>
              {billing.invitations.map((inv) => (
                <tr key={inv._id}>
                  <td>{inv.groomName} & {inv.brideName}</td>
                  <td>{new Date(inv.sentAt).toLocaleDateString("uz")}</td>
                  <td>{fmt(inv.priceSnapshot)}</td>
                  <td>
                    <span
                      className={`badge ${inv.isPaid ? "paid" : "unpaid"}`}
                      style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}
                      onClick={() => togglePay(inv)}
                    >
                      {inv.isPaid ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                      {inv.isPaid ? "To'langan" : "Qarz"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}
    </Layout>
  );
}
