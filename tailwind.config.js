/** @type {import('tailwindcss').Config} */
export default {
  // preflight (base reset) o'chirilgan — eski qo'lyozma CSS (index.css) buzilmasligi uchun.
  // Faqat utility klasslar ishlatiladi (asosan to'yxona admin "premium" sahifalarida).
  corePlugins: { preflight: false },
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        gold: {
          50: "#fbf7ef",
          100: "#f6ecd6",
          200: "#ecd6a8",
          300: "#e0bd77",
          400: "#d4a24e",
          500: "#c2873a",
          600: "#a86d2f",
          700: "#875328",
          800: "#6f4426",
          900: "#5d3a23",
        },
        cream: "#faf6ef",
      },
      fontFamily: {
        serif: ["'Cormorant Garamond'", "serif"],
        script: ["'Great Vibes'", "cursive"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        premium: "0 20px 60px -15px rgba(135, 83, 40, 0.25)",
        gold: "0 8px 30px -8px rgba(194, 135, 58, 0.45)",
      },
      keyframes: {
        floatUp: {
          "0%": { transform: "translateY(0) translateX(0) rotate(0deg)", opacity: "0" },
          "10%": { opacity: "0.9" },
          "90%": { opacity: "0.7" },
          "100%": { transform: "translateY(-110vh) translateX(var(--drift, 20px)) rotate(360deg)", opacity: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 3s linear infinite",
        fadeUp: "fadeUp 0.5s ease both",
      },
    },
  },
  plugins: [],
};
