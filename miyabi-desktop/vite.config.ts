import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],
  root: __dirname,
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["./src/**/*.test.{ts,tsx}", "./tests/**/*.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**", "../**"],
    coverage: {
      reporter: ["text", "html"],
    },
  },

  // Prevent Node.js modules from being bundled for browser
  optimizeDeps: {
    exclude: ["firebase-admin"],
  },

  build: {
    rollupOptions: {
      external: [
        "firebase-admin",
        "events",
        "crypto",
        "fs",
        "path",
        "os",
      ],
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
