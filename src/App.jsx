import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { ProtectedRoute } from "./components/UI";
import Login from "./pages/Login";
import AdminDashboard from "./pages/superadmin/AdminDashboard";
import Venues from "./pages/superadmin/Venues";
import Billing from "./pages/superadmin/Billing";
import Inbox from "./pages/superadmin/Inbox";
import VenueDashboard from "./pages/venue/VenueDashboard";
import Invitations from "./pages/venue/Invitations";
import PublicInvitation from "./pages/public/PublicInvitation";

function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "super_admin" ? "/admin" : "/venue"} replace />;
}

// To'liq ekran yuklanish / xabar ekrani (Telegram WebApp uchun)
function TgScreen({ text, sub, spinning = true }) {
  return (
    <div className="tg-screen">
      <div className="tg-logo">TOY<span>.UZ</span></div>
      {spinning && <div className="tg-spinner" />}
      <div className="tg-text">{text}</div>
      {sub && <div className="tg-sub">{sub}</div>}
    </div>
  );
}

function AppRoutes() {
  const { user, telegramLogin } = useAuth();
  const navigate = useNavigate();
  const tg = typeof window !== "undefined" ? window.Telegram?.WebApp : null;
  const hasInit = !!tg?.initData;
  // Telegramdan ochilgan va hali kirilmagan bo'lsa — avto-kirish holati
  const [tgState, setTgState] = useState(hasInit && !user ? "auth" : "idle");
  const [tgErr, setTgErr] = useState("");

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
    }
    if (hasInit && !user) {
      telegramLogin(tg.initData)
        .then((d) => {
          setTgState("idle");
          navigate(d.role === "super_admin" ? "/admin" : "/venue", { replace: true });
        })
        .catch((e) => {
          setTgErr(e?.response?.data?.message || "Kirishda xato");
          setTgState("error");
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (tgState === "auth") return <TgScreen text="Telegram orqali kirilmoqda..." />;
  if (tgState === "error")
    return <TgScreen spinning={false} text="Avtomatik kirib bo'lmadi" sub={tgErr || "Botda /start bosib, login va parolingiz bilan ulang."} />;

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

      {/* Super Admin */}
      <Route path="/admin" element={<ProtectedRoute role="super_admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/inbox" element={<ProtectedRoute role="super_admin"><Inbox /></ProtectedRoute>} />
      <Route path="/admin/venues" element={<ProtectedRoute role="super_admin"><Venues /></ProtectedRoute>} />
      <Route path="/admin/billing" element={<ProtectedRoute role="super_admin"><Billing /></ProtectedRoute>} />

      {/* Venue Admin */}
      <Route path="/venue" element={<ProtectedRoute role="venue_admin"><VenueDashboard /></ProtectedRoute>} />
      <Route path="/venue/invitations" element={<ProtectedRoute role="venue_admin"><Invitations /></ProtectedRoute>} />

      {/* Public */}
      <Route path="/i/:id" element={<PublicInvitation />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}
