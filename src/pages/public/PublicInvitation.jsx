import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/client";
import { buildPreviewDoc, computeTarget } from "../../lib/design";
import { Frown, Music, CalendarDays, Clock, MapPin, Navigation } from "lucide-react";

// ===== SEO: sahifa meta teglarini dinamik to'ldirish =====
function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content || "");
}
function applySeo(inv) {
  const title = `${inv.groomName} & ${inv.brideName} — To'y taklifnomasi`;
  const dateStr = inv.weddingDate
    ? new Date(inv.weddingDate).toLocaleDateString("uz-UZ", { day: "numeric", month: "long", year: "numeric" })
    : "";
  const place = inv.venueName || inv.address || "";
  const desc = [dateStr, inv.weddingTime, place].filter(Boolean).join(" • ") || "Sizni to'yimizga taklif qilamiz!";
  const image = inv.images?.[0] || inv.design?.preview || "";
  const url = window.location.href;

  document.title = title;
  document.documentElement.lang = "uz";
  setMeta("name", "description", desc);
  setMeta("property", "og:type", "website");
  setMeta("property", "og:site_name", "TOY.UZ");
  setMeta("property", "og:title", title);
  setMeta("property", "og:description", desc);
  setMeta("property", "og:url", url);
  if (image) setMeta("property", "og:image", image);
  setMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
  setMeta("name", "twitter:title", title);
  setMeta("name", "twitter:description", desc);
  if (image) setMeta("name", "twitter:image", image);
  // canonical
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
  link.href = url;
}

function useCountdown(target) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      setT({
        d: Math.floor(diff / 86400000),
        h: Math.floor(diff / 3600000) % 24,
        m: Math.floor(diff / 60000) % 60,
        s: Math.floor(diff / 1000) % 60,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return t;
}

function FallbackInvitation({ inv }) {
  const t = useCountdown(computeTarget(inv.weddingDate, inv.weddingTime));
  const cover = inv.images?.[0];
  const dateStr = new Date(inv.weddingDate).toLocaleDateString("uz", { day: "numeric", month: "long", year: "numeric" });
  return (
    <div className="pub theme-classic">
      <section className="pub-hero">
        {cover && <div className="pub-hero-bg" style={{ backgroundImage: `url(${cover})` }} />}
        <div className="pub-hero-overlay" />
        <div className="pub-hero-content">
          <div className="pub-eyebrow">BIZNING TO'YIMIZ</div>
          <h1 className="pub-names"><span>{inv.groomName}</span><span className="pub-amp">&amp;</span><span>{inv.brideName}</span></h1>
          <div className="pub-date">
            <span><CalendarDays size={16} /> {dateStr}</span><span className="dot">•</span><span><Clock size={16} /> {inv.weddingTime}</span>
          </div>
          {inv.venueName && <div className="pub-venue">{inv.venueName}</div>}
          <div className="pub-countdown">
            {[["Kun", t.d], ["Soat", t.h], ["Daqiqa", t.m], ["Soniya", t.s]].map(([l, v]) => (
              <div key={l} className="cd-box"><div className="cd-num">{String(v).padStart(2, "0")}</div><div className="cd-label">{l}</div></div>
            ))}
          </div>
        </div>
      </section>
      {inv.images?.length > 0 && (
        <section className="pub-section">
          <div className="pub-gallery">
            {inv.images.map((u, i) => (
              <a key={i} href={u} target="_blank" rel="noreferrer" className="pub-gallery-item"><img src={u} alt="" loading="lazy" /></a>
            ))}
          </div>
        </section>
      )}
      {(inv.address || inv.mapLink) && (
        <section className="pub-section">
          <div className="pub-sec-title"><MapPin size={18} /> Manzil</div>
          {inv.address && <p className="pub-address">{inv.address}</p>}
          {inv.mapLink && <a href={inv.mapLink} target="_blank" rel="noreferrer" className="pub-map-btn"><Navigation size={16} /> Xaritada ochish</a>}
        </section>
      )}
      <div className="pub-footer" style={{ textAlign: "center", paddingBottom: 30 }}>TOY.UZ • Raqamli taklifnoma</div>
    </div>
  );
}

export default function PublicInvitation() {
  const { id } = useParams();
  const [inv, setInv] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    api.get(`/public/invitation/${id}`)
      .then((r) => setInv(r.data))
      .catch(() => setNotFound(true));
  }, [id]);

  useEffect(() => {
    if (inv) applySeo(inv);
  }, [inv]);

  const doc = useMemo(() => (inv?.design ? buildPreviewDoc(inv.design, inv) : null), [inv]);

  // Fallback (dizaynsiz) holatda musiqa avtomatik ijro — dizaynli holatda iframe ichida boshqariladi
  useEffect(() => {
    if (!inv || inv.design || !inv.music?.url) return;
    const a = audioRef.current;
    if (!a) return;
    const start = () => a.play().then(() => setPlaying(true)).catch(() => {});
    start();
    const unlock = () => { start(); cleanup(); };
    const events = ["pointerdown", "touchstart", "click", "keydown", "scroll"];
    events.forEach((e) => document.addEventListener(e, unlock, { once: false, capture: true }));
    const cleanup = () => events.forEach((e) => document.removeEventListener(e, unlock, true));
    return cleanup;
  }, [inv]);

  const toggleMusic = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play().then(() => setPlaying(true)).catch(() => {}); }
  };

  if (notFound) return (
    <div className="pub-center" style={{ flexDirection: "column", gap: 12 }}>
      <Frown size={40} color="#b08d57" /> Taklifnoma topilmadi
    </div>
  );
  if (!inv) return <div className="pub-center">Yuklanmoqda...</div>;

  return (
    <div className="pub-stage">
      <div className="pub-phone">
        {inv.design ? (
          <iframe title="taklifnoma" className="pub-frame" srcDoc={doc} sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" />
        ) : (
          <div className="pub-scroll">
            <FallbackInvitation inv={inv} />
            {inv.music?.url && (
              <>
                <audio ref={audioRef} src={inv.music.url} loop onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
                <button className={`pub-music-btn ${playing ? "playing" : ""}`} onClick={toggleMusic} title={inv.music.name || "Musiqa"}>
                  <Music size={20} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
