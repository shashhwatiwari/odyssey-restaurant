import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import type { Env } from "./types";
import { customersRouter } from "./routes/customers";
import { menuRouter } from "./routes/menu";
import { ordersRouter } from "./routes/orders";
import { settingsRouter } from "./routes/settings";
import { statsRouter } from "./routes/stats";

const app = new OpenAPIHono<{ Bindings: Env }>();

app.use("*", cors());

// /doc serves the full OpenAPI 3.0 spec — this is what export-spec.ts captures
// and what Orval reads to generate the typed frontend client.
app.doc("/doc", {
  openapi: "3.0.0",
  info: { title: "Odyssey Restaurant API", version: "1.0.0" },
  servers: [{ url: "http://localhost:8787", description: "Local dev" }],
});

app.get("/health", (c) => c.json({ status: "ok" }));

// Each router is mounted at its prefix. OpenAPIHono merges sub-router OpenAPI
// registrations into the parent spec automatically.
app.route("/settings", settingsRouter);
app.route("/menu", menuRouter);
app.route("/customers", customersRouter);
app.route("/orders", ordersRouter);
app.route("/stats", statsRouter);

export { app };
export default app;
