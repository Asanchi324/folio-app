import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  // Allow opening the built app directly from the file system (file://)
  base: "./",
  server: {
    port: 5173
  }
});


 