import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // "server-only" solo existe para Next.js; en tests (Node puro) se omite.
      "server-only": path.resolve(__dirname, "vitest/stubs/server-only.ts"),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    globals: false,
    // PGlite compila WASM la primera vez: margen generoso en CI lentas
    testTimeout: 15_000,
    hookTimeout: 30_000,
  },
});
