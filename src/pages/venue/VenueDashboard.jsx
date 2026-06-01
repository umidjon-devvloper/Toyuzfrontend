import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import { Layout, fmt } from "../../components/UI";
import { Mails, Send, FileText, Users, Plus } from "lucide-react";

export default function VenueDashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/venue/stats").then((r) => setStats(r.data));
    api.get("/venue/invitations").then((r) => setRecent(r.data.slice(0, 5)));
  }, []);

  return (
    <Layout title="Boshqaruv paneli">
      <div className="stat-grid">
        <div className="stat-card">
          <div className="ic"><Mails size={20} /></div>
          <span className="value">{stats?.total ?? "—"}</span>
          <span className="label">Jami taklifnomalar</span>
          <span className="sub">Yaratilgan</span>
        </div>
        <div className="stat-card">
          <div className="ic"><Send size={20} /></div>
          <span className="value" style={{ color: "var(--primary)" }}>{stats?.sent ?? "—"}</span>
          <span className="label">Yuborilgan</span>
          <span className="sub">Hisobga olingan</span>
        </div>
        <div className="stat-card">
          <div className="ic"><FileText size={20} /></div>
          <span className="value">{stats?.draft ?? "—"}</span>
          <span className="label">Qoralama</span>
          <span className="sub">Hali yuborilmagan</span>
        </div>
        <div className="stat-card">
          <div className="ic"><Users size={20} /></div>
          <span className="value">{fmt(stats?.guests)}</span>
          <span className="label">Jami mehmonlar</span>
          <span className="sub">RSVP javoblari</span>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>So'nggi taklifnomalar</h2>
          <button className="btn btn-primary btn-sm" onClick={() => navigate("/venue/invitations")}>
            <Plus size={16} /> Taklifnoma qo'shish
          </button>
        </div>
        {recent.length === 0 ? (
          <div className="empty">Hali taklifnoma yo'q. Yangisini qo'shing.</div>
        ) : (
          <table>
            <thead>
              <tr><th>Kuyov-Kelin</th><th>Sana</th><th>Manzil</th><th>Holat</th><th>Mehmon</th></tr>
            </thead>
            <tbody>
              {recent.map((inv) => (
                <tr key={inv._id}>
                  <td style={{ fontWeight: 600 }}>{inv.groomName} & {inv.brideName}</td>
                  <td>{new Date(inv.weddingDate).toLocaleDateString("uz")} • {inv.weddingTime}</td>
                  <td>{inv.venueName || inv.address || "—"}</td>
                  <td>
                    <span className={`badge ${inv.status}`}>
                      {inv.status === "sent" ? "Yuborilgan" : "Qoralama"}
                    </span>
                  </td>
                  <td>{inv.rsvpGuests}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
