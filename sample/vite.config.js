import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { generatePackageJson } from "../dist";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), generatePackageJson()],
});
