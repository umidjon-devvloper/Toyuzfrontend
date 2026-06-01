import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

// Har bir so'rovga tokenni qo'shish
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Taklifnoma ulashish havolasi — backend OG sahifasiga ishora qiladi.
// Backend /i/:id sahifasi rasm + sarlavha bilan (og:image) link-previewni chiroyli ko'rsatadi
// va odam ochsa frontend SPA'ga yo'naltiradi. Shu sababli Telegramda rasm chiqadi.
export const shareBase = () => {
  // VITE_SHARE_BASE_URL bo'lsa o'sha; aks holda VITE_API_URL dan "/api" ni olib tashlaymiz
  const explicit = import.meta.env.VITE_SHARE_BASE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const apiBase = import.meta.env.VITE_API_URL || "";
  const root = apiBase.replace(/\/api\/?$/, "");
  if (/^https?:\/\//.test(root)) return root;
  return window.location.origin; // dev rejimida frontend
};
export const shareLink = (id) => `${shareBase()}/i/${id}`;

// 401 bo'lsa logout
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (!window.location.pathname.includes("login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;
