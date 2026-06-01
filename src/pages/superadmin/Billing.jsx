import { useEffect, useState } from "react";
import api from "../../api/client";
import { Layout, Modal, fmt, monthName } from "../../components/UI";
import { CheckCircle2, Clock } from "lucide-react";

export default function Billing() {
  const [venues, setVenues] = useState([]);
  const [selected, setSelected] = useState(null);
  const [billing, setBilling] = useState(null);

  useEffect(() => {
    api.get("/admin/venues").then((r) => setVenues(r.data));
  }, []);

  const openBilling = async (v) => {
    setSelected(v);
    const { data } = await api.get(`/admin/venues/${v._id}/billing`);
    setBilling(data);
  };

  const payMonth = async (y, m) => {
    if (!window.confirm(`${monthName(m)} ${y} oyini to'langan deb belgilaysizmi?`)) return;
    await api.put(`/admin/venues/${selected._id}/pay-month`, { year: y, month: m });
    openBilling(selected);
    api.get("/admin/venues").then((r) => setVenues(r.data));
  };

  const togglePay = async (inv) => {
    await api.put(`/admin/invitations/${inv._id}/pay`, { isPaid: !inv.isPaid });
    openBilling(selected);
  };

  return (
    <Layout title="Hisob-kitob">
      <div className="card">
        <div className="card-head"><h2>To'yxonalar bo'yicha hisob</h2></div>
        <table>
          <thead>
            <tr>
              <th>To'yxona</th><th>Narx/taklif</th><th>Yuborilgan</th>
              <th>Qarzi</th><th></th>
            </tr>
          </thead>
          <tbody>
            {venues.map((v) => (
              <tr key={v._id}>
                <td style={{ fontWeight: 600 }}>{v.name}</td>
                <td>{fmt(v.pricePerInvitation)} so'm</td>
                <td>{v.sentCount} ta</td>
                <td style={{ color: v.debt > 0 ? "var(--orange)" : "var(--green)", fontWeight: 600 }}>
                  {fmt(v.debt)} so'm
                </td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => openBilling(v)}>
                    Batafsil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && billing && (
        <Modal title={`${selected.name} — hisob-kitob`} onClose={() => { setSelected(null); setBilling(null); }}>
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>Oylar bo'yicha</h3>
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
                    <td style={{ color: m.unpaid > 0 ? "var(--orange)" : "var(--green)", fontWeight: 600 }}>
                      {fmt(m.unpaid)}
                    </td>
                    <td>
                      {m.unpaid > 0 && (
                        <button className="btn btn-sm btn-primary" onClick={() => payMonth(m._id.y, m._id.m)}>
                          To'landi
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h3 style={{ fontSize: 15, marginBottom: 12 }}>Taklifnomalar ro'yxati</h3>
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
