import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Le port du backend est découvert au runtime, dans le navigateur (voir
// src/lib/backendDiscovery.ts) — rien à résoudre ici au démarrage de Vite.
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 5173
  }
});
