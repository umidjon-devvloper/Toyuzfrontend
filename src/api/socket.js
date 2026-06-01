import { io } from "socket.io-client";

// API manzilidan socket manzilini olamiz: ".../api" -> "..."
const API_URL = import.meta.env.VITE_API_URL || "/api";
const SOCKET_URL = API_URL.replace(/\/api\/?$/, "") || window.location.origin;

let socket = null;

// Tokenli socket ulanishini ochamiz (bitta umumiy ulanish)
export const connectSocket = (token) => {
  if (socket) socket.disconnect();
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    autoConnect: true,
  });
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
