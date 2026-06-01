import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import { Layout, fmt } from "../../components/UI";
import { useSocket } from "../../context/SocketContext";
import {
  Clock, CheckCircle2, XCircle, ListChecks, Radio, Building2,
  CalendarDays, MapPin, Wallet, FileText, Check, X, Bell, Pencil,
} from "lucide-react";

const TABS = [
  { key: "pending", label: "Kutilmoqda", Icon: Clock },
  { key: "accepted", label: "Qabul qilingan", Icon: CheckCircle2 },
  { key: "rejected", label: "Rad etilgan", Icon: XCircle },
  { key: "all", label: "Hammasi", Icon: ListChecks },
];

const HEAD = {
  pending: { Icon: Clock, text: "Qabul qilishni kutayotgan taklifnomalar" },
  accepted: { Icon: CheckCircle2, text: "Qabul qilingan taklifnomalar" },
  rejected: { Icon: XCircle, text: "Rad etilgan taklifnomalar" },
  all: { Icon: ListChecks, text: "Barcha yuborilgan taklifnomalar" },
};

const dt = (d) =>
  d ? new Date(d).toLocaleString("uz-UZ", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

// Ish jarayoni: Yaratildi → Yuborildi → Qabul/Rad
function Timeline({ inv }) {
  const steps = [
    { label: "Yaratildi", time: inv.createdAt, done: true },
    { label: "Yuborildi", time: inv.sentAt, done: inv.status === "sent" },
    inv.acceptStatus === "rejected"
      ? { label: "Rad etildi", time: null, done: true, bad: true }
      : { label: "Qabul qilindi", time: inv.acceptedAt, done: inv.acceptStatus === "accepted" },
  ];
  return (
    <div className="timeline">
      {steps.map((s, i) => (
        <div key={i} className={`tl-step ${s.done ? "done" : ""} ${s.bad ? "bad" : ""}`}>
          <div className="tl-dot">{s.bad ? <X size={13} /> : s.done ? <Check size={13} /> : null}</div>
          <div className="tl-meta">
            <span className="tl-label">{s.label}</span>
            <span className="tl-time">{s.time ? dt(s.time) : ""}</span>
          </div>
          {i < steps.length - 1 && <div className="tl-line" />}
        </div>
      ))}
    </div>
  );
}

export default function Inbox() {
  const [tab, setTab] = useState("pending");
  const [data, setData] = useState({ list: [], counts: { pending: 0, accepted: 0, rejected: 0 } });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const { lastEvent, setPendingCount } = useSocket();
  const navigate = useNavigate();

  const load = useCallback(
    (showLoad = true) => {
      if (showLoad) setLoading(true);
      api
        .get("/admin/invitations", { params: { accept: tab } })
        .then((r) => {
          setData(r.data);
          setPendingCount(r.data?.counts?.pending || 0);
        })
        .finally(() => setLoading(false));
    },
    [tab, setPendingCount]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Real-time: yangi taklifnoma kelsa yoki yangilansa — ro'yxatni jimgina yangilaymiz
  useEffect(() => {
    if (lastEvent) load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastEvent]);

  const accept = async (inv) => {
    setBusy(inv._id);
    try {
      await api.put(`/admin/invitations/${inv._id}/accept`);
      load(false);
    } finally {
      setBusy(null);
    }
  };

  const reject = async (inv) => {
    const reason = window.prompt("Rad etish sababi (ixtiyoriy):", "");
    if (reason === null) return;
    setBusy(inv._id);
    try {
      await api.put(`/admin/invitations/${inv._id}/reject`, { reason });
      load(false);
    } finally {
      setBusy(null);
    }
  };

  const { list, counts } = data;
  const head = HEAD[tab];

  return (
    <Layout title="Taklifnoma oqimi">
      <div className="inbox-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`inbox-tab ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><t.Icon size={16} /> {t.label}</span>
            {t.key !== "all" && counts[t.key] > 0 && (
              <span className={`tab-count ${t.key}`}>{counts[t.key]}</span>
            )}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-head">
          <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <head.Icon size={18} /> {head.text}
          </h2>
          <span className="live-dot" title="Real-time yoqilgan" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Radio size={14} /> jonli
          </span>
        </div>

        {loading ? (
          <div className="loading">Yuklanmoqda...</div>
        ) : list.length === 0 ? (
          <div className="empty">
            {tab === "pending" ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Bell size={16} /> Hozircha kutilayotgan taklifnoma yo'q. Yangi yuborilganda shu yerda paydo bo'ladi.
              </span>
            ) : "Bo'sh."}
          </div>
        ) : (
          <div className="inbox-grid">
            {list.map((inv) => (
              <div key={inv._id} className={`inbox-card st-${inv.acceptStatus}`}>
                <div className="ic-head">
                  <div>
                    <div className="ic-couple">{inv.groomName} & {inv.brideName}</div>
                    <div className="ic-venue" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <Building2 size={13} /> {inv.venue?.name || "—"}{inv.venue?.phone ? ` • ${inv.venue.phone}` : ""}
                    </div>
                  </div>
                  <span className={`badge ${inv.acceptStatus}`}>
                    {inv.acceptStatus === "pending" && "Kutilmoqda"}
                    {inv.acceptStatus === "accepted" && "Qabul qilingan"}
                    {inv.acceptStatus === "rejected" && "Rad etilgan"}
                  </span>
                </div>

                {inv.images?.length > 0 && (
                  <div className="ic-images">
                    {inv.images.slice(0, 3).map((u, i) => (
                      <a key={i} href={u} target="_blank" rel="noreferrer"><img src={u} alt="" /></a>
                    ))}
                    {inv.images.length > 3 && <span className="ic-more">+{inv.images.length - 3}</span>}
                  </div>
                )}

                <div className="ic-info">
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><CalendarDays size={14} /> {new Date(inv.weddingDate).toLocaleDateString("uz")} • {inv.weddingTime}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><MapPin size={14} /> {inv.venueName || inv.address || "—"}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Wallet size={14} /> {fmt(inv.priceSnapshot)} so'm</span>
                </div>

                {inv.description && (
                  <div className="ic-desc" style={{ display: "flex", gap: 6 }}>
                    <FileText size={14} style={{ flexShrink: 0, marginTop: 2 }} /> <span>{inv.description}</span>
                  </div>
                )}

                <Timeline inv={inv} />

                {inv.acceptStatus === "rejected" && inv.rejectReason && (
                  <div className="reject-reason">Sabab: {inv.rejectReason}</div>
                )}

                <div className="ic-actions">
                  {inv.acceptStatus === "pending" && (
                    <>
                      <button className="btn btn-primary btn-sm" disabled={busy === inv._id} onClick={() => accept(inv)}>
                        <Check size={15} /> {busy === inv._id ? "..." : "Qabul qilish"}
                      </button>
                      <button className="btn btn-ghost btn-sm" disabled={busy === inv._id} onClick={() => reject(inv)}>
                        <X size={15} /> Rad etish
                      </button>
                    </>
                  )}
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/admin/invitations/${inv._id}`)} title="To'liq tahrirlash">
                    <Pencil size={15} /> Tahrirlash
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
