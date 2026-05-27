import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { createDb } from "../db";
import * as schema from "../db/schema";
import { ErrorSchema } from "../lib/schemas";
import type { Env } from "../types";

// createSelectSchema reflects every column's Drizzle type into a Zod schema.
// We override timestamp columns: JSON serialises Date objects as ISO strings,
// so z.string().datetime() matches what the API actually returns.
const SettingsSchema = createSelectSchema(schema.settings, {
  updatedAt: z.string().datetime(),
});

// createInsertSchema gives us validation for writable fields.
// We omit id (always 1) and updatedAt (server-set), then make everything
// optional so clients can PATCH just the fields they want to change.
const UpdateSettingsSchema = createInsertSchema(schema.settings, {
  openingHour: z.number().int().min(0).max(23),
  closingHour: z.number().int().min(0).max(23),
  prepTimeMinutes: z.number().int().min(1).max(480),
})
  .omit({ id: true, updatedAt: true })
  .partial();

const router = new OpenAPIHono<{ Bindings: Env }>();

const getRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["settings"],
  summary: "Get restaurant settings",
  responses: {
    200: {
      content: { "application/json": { schema: SettingsSchema } },
      description: "Current settings",
    },
    404: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Settings not seeded — run pnpm db:seed",
    },
  },
});

router.openapi(getRoute, async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const row = await db.query.settings.findFirst();
  if (!row) return c.json({ error: "Settings not found. Run pnpm db:seed." }, 404);
  return c.json(row, 200);
});

const patchRoute = createRoute({
  method: "patch",
  path: "/",
  tags: ["settings"],
  summary: "Update restaurant settings",
  request: {
    body: {
      content: { "application/json": { schema: UpdateSettingsSchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: SettingsSchema } },
      description: "Updated settings",
    },
    404: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Settings not seeded",
    },
  },
});

router.openapi(patchRoute, async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const body = c.req.valid("json");

  const [updated] = await db
    .update(schema.settings)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(schema.settings.id, 1))
    .returning();

  if (!updated) return c.json({ error: "Settings not found. Run pnpm db:seed." }, 404);
  return c.json(updated, 200);
});

export { router as settingsRouter };
