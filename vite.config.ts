import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import viteReact from "@vitejs/plugin-react";
import istanbul from "vite-plugin-istanbul";

export default defineConfig({
  plugins: [
    viteReact(),
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    istanbul({
      include: ["src/**/*.{js,jsx,ts,tsx}"],
      exclude: ["cypress/**", "node_modules/**"],
      extension: [".js", ".jsx", ".ts", ".tsx"],
      requireEnv: false,
      cypress: true,
    }),
  ],
  resolve: {
    alias: {
      "@": `${process.cwd()}/src`
    },
  },
  server: {
    port: 5173,
    // Dev runs same-origin: /api is forwarded to the Symfony backend, so the
    // HttpOnly JWT cookie and the CSRF double-submit work exactly as in prod.
    // Set VITE_API_BASE_URL instead when the API lives on another domain.
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY_TARGET || "http://127.0.0.1:8000",
        changeOrigin: false,
      },
      "/uploads": {
        target: process.env.VITE_API_PROXY_TARGET || "http://127.0.0.1:8000",
        changeOrigin: false,
      },
    },
  }
});
