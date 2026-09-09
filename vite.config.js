import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",
      injectManifest: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // The NSFW model (only fetched if someone uploads a profile picture)
        // and the three.js/character-viewer bundle are large and optional -
        // never force every installing user to download them upfront.
        globIgnores: ["**/vendor-nsfw-*.js", "**/vendor-3d-*.js"],
      },
      includeAssets: ["icons/favicon.svg", "icons/favicon-32.png", "icons/apple-touch-icon.png"],
      manifest: {
        name: "Cookin'",
        short_name: "Cookin'",
        description: "Real meals you actually make, turned into rank, rarity, and a collection worth showing off.",
        start_url: "/",
        display: "standalone",
        background_color: "#1C1611",
        theme_color: "#1C1611",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Stable names for the two heavy/optional vendor bundles so the PWA
        // config above can reliably glob-ignore them (content hashes alone
        // aren't matchable ahead of time).
        manualChunks(id) {
          if (id.includes("nsfwjs") || id.includes("@tensorflow")) return "vendor-nsfw";
          if (id.includes("node_modules/three") || id.includes("@react-three")) return "vendor-3d";
        },
      },
    },
  },
});
