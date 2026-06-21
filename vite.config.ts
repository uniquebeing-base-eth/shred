import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart as tanstackStartVite } from "@tanstack/react-start/plugin/vite";
import viteTailwindcss from "@tailwindcss/vite";

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [tanstackStartVite({
    server: { entry: "server" },
  }), viteReact(), viteTsConfigPaths(), viteTailwindcss(), cloudflare({
    viteEnvironment: {
      name: "ssr"
    }
  })],
  ssr: {
    noExternal: ["@radix-ui/*"],
  },
});