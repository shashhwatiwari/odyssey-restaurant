import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// createDb is called inside each Hono route handler, NOT at module init.
//
// Why: Cloudflare Workers inject environment bindings (DATABASE_URL, etc.) per-request
// via the handler's second argument. They are not available as process.env at module
// load time — if you call neon() here at the top level, DATABASE_URL is undefined
// and the connection fails silently. This is a Workers-specific constraint.
//
// The Neon HTTP client is cheap to construct (no persistent TCP socket), so
// creating it per-request has negligible overhead.
export function createDb(databaseUrl: string) {
  // neon() returns a tagged-template SQL executor that speaks HTTP to Neon's endpoint.
  // drizzle() wraps it with the query builder and schema-aware type inference.
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

export type Db = ReturnType<typeof createDb>;
