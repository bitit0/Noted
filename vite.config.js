import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Migrated from Create React App. Vite serves without bundling on startup, so
// the dev server comes up in ~1s instead of webpack's cold-bundle wait.
export default defineConfig({
  plugins: [react()],
  server: { port: 3000, open: true },
  build: { outDir: "build" }, // match CRA's output dir
  // CRA exposed env vars prefixed REACT_APP_; keep existing .env files working.
  envPrefix: ["VITE_", "REACT_APP_"],
});
