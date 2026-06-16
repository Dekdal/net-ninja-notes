import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

// Plain Vite SPA build (static output in dist/). Deployed to GitHub Pages
// under the repo subpath, so `base` must match:
//   https://dekdal.github.io/net-ninja-notes/
export default defineConfig({
  base: "/net-ninja-notes/",
  plugins: [
    tsConfigPaths(),
    // Must run before the React plugin so generated routes are transformed.
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  build: {
    outDir: "dist",
  },
});
