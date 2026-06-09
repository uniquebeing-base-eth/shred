import { defineConfig } from "vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart as tanstackStartVite } from "@tanstack/react-start/plugin/vite";
import viteTailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    tanstackStartVite({
      server: { entry: "server" },
    }),
    viteReact(),
    viteTsConfigPaths(),
    viteTailwindcss(),
  ],
  ssr: {
    noExternal: ["@radix-ui/*"],
  },
});
