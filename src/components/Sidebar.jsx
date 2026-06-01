import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import {
  LayoutDashboard, Inbox, Building2, Wallet, Mails, LogOut,
} from "lucide-react";

const superAdminLinks = [
  { to: "/admin", label: "Boshqaruv", Icon: LayoutDashboard, end: true },
  { to: "/admin/inbox", label: "Oqim", Icon: Inbox, badge: "pending" },
  { to: "/admin/venues", label: "To'yxonalar", Icon: Building2 },
  { to: "/admin/billing", label: "Hisob", Icon: Wallet },
];

const venueLinks = [
  { to: "/venue", label: "Boshqaruv", Icon: LayoutDashboard, end: true },
  { to: "/venue/invitations", label: "Taklifnomalar", Icon: Mails },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { pendingCount, connected } = useSocket() || {};
  const links = user?.role === "super_admin" ? superAdminLinks : venueLinks;

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="sidebar">
        <div className="logo">
          TOY<span>.UZ</span>
        </div>
        {links.map(({ to, label, Icon, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span className="ic"><Icon size={19} /></span>
            <span>{label}</span>
            {badge === "pending" && pendingCount > 0 && (
              <span className="nav-badge">{pendingCount}</span>
            )}
          </NavLink>
        ))}
        <div className="spacer" />
        <div className="conn-status" title="Real-time aloqa holati">
          <span className={`conn-dot ${connected ? "on" : "off"}`} />
          {connected ? "Onlayn (jonli)" : "Aloqa yo'q"}
        </div>
        <button className="nav-item" onClick={logout}>
          <span className="ic"><LogOut size={19} /></span>
          <span>Chiqish</span>
        </button>
      </aside>

      {/* MOBIL PASTKI NAVBAR */}
      <nav className="mobile-bottomnav">
        {links.map(({ to, label, Icon, end, badge }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => `mb-item ${isActive ? "active" : ""}`}>
            <span className="mb-ic">
              <Icon size={20} />
              {badge === "pending" && pendingCount > 0 && <span className="mb-badge">{pendingCount}</span>}
            </span>
            <span>{label}</span>
          </NavLink>
        ))}
        <button className="mb-item" onClick={logout}>
          <span className="mb-ic"><LogOut size={20} /></span>
          <span>Chiqish</span>
        </button>
      </nav>
    </>
  );
}
