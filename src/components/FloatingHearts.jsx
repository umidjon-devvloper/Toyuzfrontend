import { useMemo } from "react";

// Optimallashtirilgan suzuvchi yurakcha / gul animatsiyasi (premium fon).
// • Faqat transform + opacity (GPU) ishlatiladi — qayta-bo'yash (repaint) yo'q, qotmaydi.
// • Elementlar soni cheklangan (default 14).
// • prefers-reduced-motion bo'lsa CSS o'zi yashiradi (.toy-float).
// • pointer-events: none — bosishlarga xalal bermaydi.

const HEARTS = ["❤", "🤍", "💛", "🌸", "🌷", "✿"];

export default function FloatingHearts({ count = 14, variant = "gold" }) {
  const items = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const r = (n) => Math.random() * n;
      arr.push({
        left: r(100),
        size: 12 + r(20),
        duration: 9 + r(9),
        delay: -r(14),
        drift: (r(80) - 40).toFixed(0) + "px",
        char: HEARTS[Math.floor(r(HEARTS.length))],
        opacity: 0.35 + r(0.4),
      });
    }
    return arr;
  }, [count]);

  const tint = variant === "gold" ? "saturate(0.85)" : "none";

  return (
    <div className="toy-float-layer" aria-hidden="true">
      {items.map((it, i) => (
        <span
          key={i}
          className="toy-float"
          style={{
            left: `${it.left}%`,
            fontSize: `${it.size}px`,
            animationDuration: `${it.duration}s`,
            animationDelay: `${it.delay}s`,
            opacity: it.opacity,
            filter: tint,
            "--drift": it.drift,
          }}
        >
          {it.char}
        </span>
      ))}
    </div>
  );
}
