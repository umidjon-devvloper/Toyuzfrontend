import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { connectSocket, disconnectSocket } from "../api/socket";
import api from "../api/client";
import { MailPlus, CheckCircle2, XCircle } from "lucide-react";

const SocketContext = createContext(null);

let toastId = 0;

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [pendingCount, setPendingCount] = useState(0); // sidebar badge (super admin)
  const [toasts, setToasts] = useState([]);
  // Sahifalar uchun "oxirgi hodisa" — Inbox/Invitations shunga reaksiya qiladi
  const [lastEvent, setLastEvent] = useState(null);

  const pushToast = useCallback((toast) => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, ...toast }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 6000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  useEffect(() => {
    if (!user) {
      disconnectSocket();
      socketRef.current = null;
      setConnected(false);
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = connectSocket(token);
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));

    if (user.role === "super_admin") {
      // Boshlang'ich kutilayotgan sonni olamiz
      api
        .get("/admin/invitations", { params: { accept: "pending" } })
        .then((r) => setPendingCount(r.data?.counts?.pending || 0))
        .catch(() => {});

      // 🔴 Yangi taklifnoma keldi
      socket.on("invitation:incoming", (data) => {
        setPendingCount((c) => c + 1);
        setLastEvent({ type: "incoming", data, t: id() });
        pushToast({
          kind: "incoming",
          title: "Yangi taklifnoma keldi!",
          text: `${data.venue?.name || "To'yxona"}: ${data.invitation?.groomName} & ${data.invitation?.brideName}`,
        });
      });

      // Boshqa panel/tab qabul yoki rad etsa — badge'ni moslaymiz
      socket.on("invitation:updated", (data) => {
        setPendingCount((c) => Math.max(0, c - 1));
        setLastEvent({ type: "updated", data, t: id() });
      });
    }

    if (user.role === "venue_admin") {
      socket.on("invitation:accepted", (data) => {
        setLastEvent({ type: "accepted", data, t: id() });
        pushToast({ kind: "accepted", title: "Qabul qilindi", text: "Taklifnomangiz bosh admin tomonidan qabul qilindi." });
      });
      socket.on("invitation:rejected", (data) => {
        setLastEvent({ type: "rejected", data, t: id() });
        pushToast({
          kind: "rejected",
          title: "Rad etildi",
          text: data?.reason ? `Sabab: ${data.reason}` : "Taklifnomangiz rad etildi.",
        });
      });
    }

    return () => {
      socket.off();
      disconnectSocket();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        connected,
        pendingCount,
        setPendingCount,
        lastEvent,
        pushToast,
      }}
    >
      {children}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </SocketContext.Provider>
  );
};

// Har bir hodisaga unikal vaqt belgisi (Date o'rniga oddiy hisoblagich)
let _t = 0;
function id() {
  return ++_t;
}

const TOAST_ICON = { incoming: MailPlus, accepted: CheckCircle2, rejected: XCircle };

function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-stack">
      {toasts.map((t) => {
        const Icon = TOAST_ICON[t.kind] || MailPlus;
        return (
          <div key={t.id} className={`toast toast-${t.kind}`} onClick={() => onDismiss(t.id)}>
            <div className="toast-ic"><Icon size={20} /></div>
            <div className="toast-body">
              <div className="toast-title">{t.title}</div>
              {t.text && <div className="toast-text">{t.text}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const useSocket = () => useContext(SocketContext);
