import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// drizzle-kit runs in Node.js (not Workers) to generate and run migrations.
// It needs DATABASE_URL, which in local dev lives in .dev.vars (wrangler's secrets file).
// dotenv can parse .dev.vars because it uses the same KEY=VALUE format as .env.
config({ path: ".dev.vars" });

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle", // migration SQL files are written here
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
