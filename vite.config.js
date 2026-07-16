import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    preserveSymlinks: true,
  },
  server: {
    // em dev local, `vercel dev` roda só as funções /api numa porta separada
    // (o proxy dele pro próprio Vite trava neste ambiente) — o Vite delega
    // pra lá. Em produção a Vercel serve /api nativamente, sem esse proxy.
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
