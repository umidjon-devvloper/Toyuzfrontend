import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // tarmoqqa ochiq (tunnel/telefon uchun)
    port: 5173,
    // ngrok / cloudflared kabi tunnel domenlariga ruxsat (dev uchun hammasi)
    allowedHosts: true,
    proxy: {
      "/api": "https://noncondensable-distemperedly-tameka.ngrok-free.dev",
    },
  },
});
