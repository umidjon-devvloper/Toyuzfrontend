import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";

// Himoyalangan route
export function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === "super_admin" ? "/admin" : "/venue"} replace />;
  }
  return children;
}

// Asosiy layout (sidebar + kontent)
export function Layout({ title, children }) {
  const { user } = useAuth();
  const initials = (user?.name || "A").slice(0, 2).toUpperCase();
  return (
    <div className="layout">
      <Sidebar />
      <main className="main">
        <div className="topbar">
          <h1>{title}</h1>
          <div className="user-chip">
            <div className="avatar">{initials}</div>
            <div className="u-meta">
              <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {user?.role === "super_admin" ? "Bosh admin" : "To'yxona admin"}
              </div>
            </div>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}

// Modal
export function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

// So'mni formatlash
export const fmt = (n) => new Intl.NumberFormat("uz-UZ").format(n || 0);
export const monthName = (m) =>
  ["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentyabr","Oktyabr","Noyabr","Dekabr"][m - 1];
