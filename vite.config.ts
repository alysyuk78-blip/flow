import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["flow.svg"],
      manifest: {
        name: "Flow — проєкти та задачі",
        short_name: "Flow",
        description: "Локальний менеджер задач і проєктів",
        theme_color: "#6366f1",
        background_color: "#ffffff",
        display: "standalone",
        lang: "uk",
        icons: [
          {
            src: "flow.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,ico,png,woff2}"],
      },
    }),
  ],
  server: {
    port: 5173,
    host: true,
    open: true,
  },
});
