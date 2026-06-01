import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/client";
import { buildPreviewDoc, computeTarget } from "../../lib/design";
import { Frown, Play, Pause, CalendarDays, Clock, MapPin, Navigation } from "lucide-react";

// Dizaynsiz taklifnoma uchun oddiy zaxira ko'rinish (countdown bilan)
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
    if (inv) document.title = `${inv.groomName} & ${inv.brideName} — TOY.UZ`;
  }, [inv]);

  const doc = useMemo(() => (inv?.design ? buildPreviewDoc(inv.design, inv) : null), [inv]);

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
      {inv.design ? (
        <iframe title="taklifnoma" className="pub-frame" srcDoc={doc} sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" />
      ) : (
        <FallbackInvitation inv={inv} />
      )}

      {inv.music?.url && (
        <>
          <audio ref={audioRef} src={inv.music.url} loop onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
          <button className="pub-music-btn" onClick={toggleMusic} title={inv.music.name || "Musiqa"}>
            {playing ? <Pause size={20} /> : <Play size={20} />}
          </button>
        </>
      )}
    </div>
  );
}
