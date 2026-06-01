import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import api from "../../api/client";
import { Layout, fmt, monthName } from "../../components/UI";
import { Building2, CheckCircle2, Mails, Wallet, Plus, Users } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/admin/stats").then((r) => setStats(r.data)).catch(() => {});
  }, []);

  const chartData =
    stats?.monthly?.map((m) => ({
      name: `${monthName(m._id.m)?.slice(0, 3)}`,
      taklif: m.count,
      summa: m.sum,
    })) || [];

  return (
    <Layout title="Boshqaruv paneli">
      <div className="stat-grid">
        <div className="stat-card">
          <div className="ic"><Building2 size={20} /></div>
          <span className="value">{stats?.totalVenues ?? "—"}</span>
          <span className="label">To'yxonalar</span>
          <span className="sub">Jami ro'yxatdan o'tgan</span>
        </div>
        <div className="stat-card">
          <div className="ic"><CheckCircle2 size={20} /></div>
          <span className="value">{stats?.activeVenues ?? "—"}</span>
          <span className="label">Aktiv to'yxonalar</span>
          <span className="sub">Hozirda ishlayotgan</span>
        </div>
        <div className="stat-card">
          <div className="ic"><Mails size={20} /></div>
          <span className="value">{stats?.totalSent ?? "—"}</span>
          <span className="label">Yuborilgan taklifnomalar</span>
          <span className="sub">Jami hisoblangan</span>
        </div>
        <div className="stat-card">
          <div className="ic"><Wallet size={20} /></div>
          <span className="value" style={{ color: "var(--orange)" }}>
            {fmt(stats?.totalDebt)}
          </span>
          <span className="label">Umumiy qarz (so'm)</span>
          <span className="sub">To'lanmagan summa</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <div className="card">
          <div className="card-head">
            <h2>Oylik taklifnomalar statistikasi</h2>
          </div>
          {chartData.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
                <XAxis dataKey="name" stroke="#8a90a6" fontSize={12} />
                <YAxis stroke="#8a90a6" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="taklif" stroke="#6d4aff" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty">Hali ma'lumot yo'q</div>
          )}
        </div>

        <div className="card">
          <div className="card-head"><h2>Tezkor amallar</h2></div>
          <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "flex-start", marginBottom: 10 }}
            onClick={() => navigate("/admin/venues")}>
            <Plus size={17} /> Yangi to'yxona qo'shish
          </button>
          <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "flex-start", marginBottom: 10 }}
            onClick={() => navigate("/admin/billing")}>
            <Wallet size={17} /> Hisob-kitobni ko'rish
          </button>
          <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "flex-start" }}
            onClick={() => navigate("/admin/venues")}>
            <Building2 size={17} /> To'yxonalarni boshqarish
          </button>

          <div style={{ marginTop: 20, padding: 16, background: "var(--primary-light)", borderRadius: 12 }}>
            <div style={{ fontSize: 13, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
              <Users size={14} /> Jami mehmonlar (RSVP)
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: "var(--primary)" }}>
              {fmt(stats?.totalGuests)}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
