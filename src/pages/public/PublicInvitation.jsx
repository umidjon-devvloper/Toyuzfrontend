import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/client";
import {
  Home, Images, Info, MapPin, Heart, CalendarDays, Clock,
  Navigation, PartyPopper, Check, Frown,
} from "lucide-react";

// Sanagacha qolgan vaqt
function useCountdown(date) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    if (!date) return;
    const tick = () => {
      const diff = new Date(date) - new Date();
      if (diff <= 0) return setT({ d: 0, h: 0, m: 0, s: 0 });
      setT({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [date]);
  return t;
}

export default function PublicInvitation() {
  const { id } = useParams();
  const [inv, setInv] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [rsvp, setRsvp] = useState({ done: false, name: "", phone: "", guests: 1, sending: false });
  const [active, setActive] = useState("home");
  const t = useCountdown(inv?.weddingDate);

  const refs = {
    home: useRef(null),
    gallery: useRef(null),
    info: useRef(null),
    location: useRef(null),
    rsvp: useRef(null),
  };

  useEffect(() => {
    api.get(`/public/invitation/${id}`)
      .then((r) => setInv(r.data))
      .catch(() => setNotFound(true));
  }, [id]);

  // Skroll bo'yicha aktiv bo'limni aniqlash
  useEffect(() => {
    const onScroll = () => {
      const mid = window.innerHeight / 2;
      let cur = "home";
      for (const key of Object.keys(refs)) {
        const el = refs[key].current;
        if (el && el.getBoundingClientRect().top <= mid) cur = key;
      }
      setActive(cur);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inv]);

  const go = (key) => refs[key].current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const submitRsvp = async () => {
    setRsvp((r) => ({ ...r, sending: true }));
    try {
      await api.post(`/public/invitation/${id}/rsvp`, { guests: rsvp.guests });
      setRsvp((r) => ({ ...r, done: true }));
    } finally {
      setRsvp((r) => ({ ...r, sending: false }));
    }
  };

  if (notFound) return (
    <div className="pub-center" style={{ flexDirection: "column", gap: 12 }}>
      <Frown size={40} color="#b08d57" /> Taklifnoma topilmadi
    </div>
  );
  if (!inv) return <div className="pub-center">Yuklanmoqda...</div>;

  const theme = inv.template || "classic";
  const images = inv.images || [];
  const cover = images[0];
  const dateStr = new Date(inv.weddingDate).toLocaleDateString("uz", {
    day: "numeric", month: "long", year: "numeric",
  });

  const navItems = [
    { key: "home", label: "Asosiy", Icon: Home },
    images.length > 0 && { key: "gallery", label: "Galereya", Icon: Images },
    inv.description && { key: "info", label: "Batafsil", Icon: Info },
    (inv.address || inv.mapLink) && { key: "location", label: "Manzil", Icon: MapPin },
    { key: "rsvp", label: "RSVP", Icon: Heart },
  ].filter(Boolean);

  return (
    <div className={`pub theme-${theme}`}>
      {/* ===== HERO ===== */}
      <section ref={refs.home} className="pub-hero">
        {cover && <div className="pub-hero-bg" style={{ backgroundImage: `url(${cover})` }} />}
        <div className="pub-hero-overlay" />
        <div className="pub-hero-content">
          <div className="pub-eyebrow"><PartyPopper size={16} /> BIZNING TO'YIMIZ</div>
          <h1 className="pub-names">
            <span>{inv.groomName}</span>
            <span className="pub-amp">&amp;</span>
            <span>{inv.brideName}</span>
          </h1>
          <div className="pub-date">
            <span><CalendarDays size={16} /> {dateStr}</span>
            <span className="dot">•</span>
            <span><Clock size={16} /> {inv.weddingTime}</span>
          </div>
          {inv.venueName && <div className="pub-venue">{inv.venueName}</div>}

          <div className="pub-countdown">
            {[["Kun", t.d], ["Soat", t.h], ["Daqiqa", t.m], ["Soniya", t.s]].map(([l, v]) => (
              <div key={l} className="cd-box">
                <div className="cd-num">{String(v).padStart(2, "0")}</div>
                <div className="cd-label">{l}</div>
              </div>
            ))}
          </div>

          <button className="pub-cta" onClick={() => go("rsvp")}>
            <Heart size={16} /> Qatnashishni tasdiqlash
          </button>
        </div>
        <div className="pub-scroll-hint">↓</div>
      </section>

      {/* ===== GALEREYA ===== */}
      {images.length > 0 && (
        <section ref={refs.gallery} className="pub-section">
          <div className="pub-sec-title"><Images size={18} /> Galereya</div>
          <div className="pub-gallery">
            {images.map((u, i) => (
              <a key={i} href={u} target="_blank" rel="noreferrer" className="pub-gallery-item">
                <img src={u} alt={`rasm ${i + 1}`} loading="lazy" />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ===== BATAFSIL ===== */}
      {inv.description && (
        <section ref={refs.info} className="pub-section">
          <div className="pub-sec-title"><Info size={18} /> Batafsil</div>
          <p className="pub-desc">{inv.description}</p>
        </section>
      )}

      {/* ===== MANZIL ===== */}
      {(inv.address || inv.mapLink) && (
        <section ref={refs.location} className="pub-section">
          <div className="pub-sec-title"><MapPin size={18} /> Manzil</div>
          {inv.address && <p className="pub-address">{inv.address}</p>}
          {inv.mapLink && (
            <a href={inv.mapLink} target="_blank" rel="noreferrer" className="pub-map-btn">
              <Navigation size={16} /> Xaritada ochish
            </a>
          )}
        </section>
      )}

      {/* ===== RSVP ===== */}
      <section ref={refs.rsvp} className="pub-section pub-rsvp">
        <div className="pub-sec-title"><Heart size={18} /> Qatnashishni tasdiqlang</div>
        {rsvp.done ? (
          <div className="pub-rsvp-done">
            <div className="done-circle"><Check size={28} /></div>
            <div>Rahmat! Javobingiz qabul qilindi</div>
          </div>
        ) : (
          <div className="pub-rsvp-form">
            <input placeholder="Ism familiya" value={rsvp.name}
              onChange={(e) => setRsvp({ ...rsvp, name: e.target.value })} />
            <input placeholder="Telefon raqam" value={rsvp.phone}
              onChange={(e) => setRsvp({ ...rsvp, phone: e.target.value })} />
            <select value={rsvp.guests} onChange={(e) => setRsvp({ ...rsvp, guests: Number(e.target.value) })}>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} kishi</option>)}
            </select>
            <button onClick={submitRsvp} disabled={rsvp.sending}>
              {rsvp.sending ? "Yuborilmoqda..." : "Tasdiqlash"}
            </button>
          </div>
        )}
        <div className="pub-footer">TOY.UZ • Raqamli taklifnoma</div>
      </section>

      {/* ===== MOBIL BOTTOM NAVBAR ===== */}
      <nav className="pub-bottomnav">
        {navItems.map(({ key, label, Icon }) => (
          <button key={key} className={`bn-item ${active === key ? "active" : ""}`} onClick={() => go(key)}>
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
