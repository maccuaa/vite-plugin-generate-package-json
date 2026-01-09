import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { generatePackageJson } from "vite-plugin-generate-package-json";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), generatePackageJson()],
});
