import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { count, desc, eq, sql } from "drizzle-orm";
import { createDb } from "../db";
import * as schema from "../db/schema";
import type { Env } from "../types";

const StatsSchema = z.object({
  totalOrders: z.number().int(),
  totalRevenue: z.number().int(), // cents; only completed orders count
  pendingOrders: z.number().int(),
  popularItems: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      orderCount: z.number().int(),
    })
  ),
});

const router = new OpenAPIHono<{ Bindings: Env }>();

router.openapi(
  createRoute({
    method: "get",
    path: "/",
    tags: ["stats"],
    summary: "Home page KPIs",
    responses: {
      200: {
        content: { "application/json": { schema: StatsSchema } },
        description: "Aggregate stats for the Home dashboard",
      },
    },
  }),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);

    // Run all four queries in parallel — they're independent reads.
    const [
      [{ totalOrders }],
      [{ totalRevenue }],
      [{ pendingOrders }],
      popularItems,
    ] = await Promise.all([
      db.select({ totalOrders: count() }).from(schema.orders),

      db
        .select({
          // SUM returns string | null in Drizzle; sql<number> casts for the type system.
          // COALESCE handles the null case (no completed orders yet).
          totalRevenue: sql<number>`coalesce(sum(${schema.orders.total}), 0)`,
        })
        .from(schema.orders)
        .where(eq(schema.orders.status, "completed")),

      db
        .select({ pendingOrders: count() })
        .from(schema.orders)
        .where(eq(schema.orders.status, "pending")),

      // Top 5 menu items by how many times they've been ordered.
      db
        .select({
          id: schema.menuItems.id,
          name: schema.menuItems.name,
          orderCount: count(schema.orderItems.id),
        })
        .from(schema.menuItems)
        .innerJoin(
          schema.orderItems,
          eq(schema.orderItems.menuItemId, schema.menuItems.id)
        )
        .groupBy(schema.menuItems.id, schema.menuItems.name)
        .orderBy(desc(count(schema.orderItems.id)))
        .limit(5),
    ]);

    return c.json(
      {
        totalOrders,
        totalRevenue: Number(totalRevenue),
        pendingOrders,
        popularItems,
      },
      200
    );
  }
);

export { router as statsRouter };
