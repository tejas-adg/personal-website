import { defineConfig } from "$fresh/server.ts";
import tailwind from "$fresh/plugins/tailwind.ts";

export default defineConfig({
  plugins: [tailwind()],
  server: {
    hostname: "0.0.0.0",
    port: 8000, // Optional: change if you want a different port
  },
});
