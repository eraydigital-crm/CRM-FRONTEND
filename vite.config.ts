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
  }
});
