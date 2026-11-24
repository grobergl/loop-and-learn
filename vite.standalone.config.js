import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
export default defineConfig({
  plugins: [viteSingleFile()],
  build: { outDir: "standalone", assetsInlineLimit: 10000000 },
});
