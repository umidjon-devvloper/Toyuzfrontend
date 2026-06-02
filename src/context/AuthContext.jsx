import { createContext, useContext, useState } from "react";
import api from "../api/client";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (loginVal, password) => {
    const { data } = await api.post("/auth/login", { login: loginVal, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data));
    setUser(data);
    return data;
  };

  // Telegram WebApp orqali avtomatik kirish
  const telegramLogin = async (initData) => {
    const { data } = await api.post("/auth/telegram", { initData });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data));
    setUser(data);
    return data;
  };

  // Sessiyani tozalash (yo'naltirishsiz) — login sahifasi shuni ishlatadi
  const clearSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const logout = () => {
    clearSession();
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, login, telegramLogin, logout, clearSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
