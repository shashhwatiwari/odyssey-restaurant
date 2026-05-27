// Exports the OpenAPI spec to packages/api-client/openapi.json.
//
// Why a script instead of fetching from the dev server:
// wrangler dev is a long-lived server. This is a short-lived Node.js script
// that imports the same Hono app object and calls getOpenAPIDocument() —
// no HTTP round-trip, no server required.
//
// Run via: pnpm --filter @ody/backend run export:spec
//      or: pnpm gen:contract (from root — runs this then Orval)

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { app } from "../index";

const spec = app.getOpenAPIDocument({
  openapi: "3.0.0",
  info: {
    title: "Odyssey Restaurant API",
    version: "1.0.0",
  },
  servers: [{ url: "http://localhost:8787", description: "Local dev" }],
});

const outPath = resolve(
  __dirname,
  "../../../../packages/api-client/openapi.json"
);

writeFileSync(outPath, JSON.stringify(spec, null, 2));
console.log(`OpenAPI spec written to ${outPath}`);
