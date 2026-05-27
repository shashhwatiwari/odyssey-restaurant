import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Run in Node.js — not the Workers runtime. This is fine for unit tests and
    // Hono app.request() tests because Hono's core and the Web Fetch API work
    // in modern Node.js without any Cloudflare-specific globals.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
