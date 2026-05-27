import { z } from "@hono/zod-openapi";

// Reused across all routes for error responses.
export const ErrorSchema = z.object({ error: z.string() });
