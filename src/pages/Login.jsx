import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, clearSession } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ login: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  // Login sahifasi ochilganda eski sessiyani tozalaymiz —
  // shunda boshqa login/parol bilan kirilganda avvalgi panel ochilib qolmaydi.
  useEffect(() => {
    clearSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      const user = await login(form.login, form.password);
      navigate(user.role === "super_admin" ? "/admin" : "/venue");
    } catch (err) {
      setError(err.response?.data?.message || "Kirishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo">TOY<span>.UZ</span></div>
        <div className="subtitle">Tizimga kirish</div>

        {error && <div className="error-msg">{error}</div>}

        <div className="form-group">
          <label>Login</label>
          <input
            placeholder="Login kiriting"
            value={form.login}
            onChange={(e) => setForm({ ...form, login: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </div>
        <div className="form-group">
          <label>Parol</label>
          <div style={{ position: "relative" }}>
            <input
              type={show ? "text" : "password"}
              placeholder="Parol kiriting"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
            <span
              onClick={() => setShow(!show)}
              style={{ position: "absolute", right: 14, top: 12, cursor: "pointer" }}
            >
              {show ? "🙈" : "👁️"}
            </span>
          </div>
        </div>
        <button
          className="btn btn-primary"
          style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
          onClick={submit}
          disabled={loading}
        >
          {loading ? "Kirilmoqda..." : "Kirish"}
        </button>
      </div>
    </div>
  );
}
