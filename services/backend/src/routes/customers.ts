import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { createDb } from "../db";
import * as schema from "../db/schema";
import { ErrorSchema } from "../lib/schemas";
import type { Env } from "../types";

// ── Schemas ──────────────────────────────────────────────────────────────────

const CustomerSchema = createSelectSchema(schema.customers, {
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// List response: each customer includes aggregate order data so the CRM page
// can render spend + order count without a second request per customer.
const CustomerWithStatsSchema = CustomerSchema.extend({
  orderCount: z.number().int(),
  totalSpend: z.number().int(), // cents
});

// Detail response: include the customer's order history.
const OrderSummaryForCrmSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.number().int(),
  status: z.enum(schema.orderStatusEnum.enumValues),
  total: z.number().int(),
  createdAt: z.string().datetime(),
});

const CustomerDetailSchema = CustomerSchema.extend({
  orderCount: z.number().int(),
  totalSpend: z.number().int(),
  orders: z.array(OrderSummaryForCrmSchema),
});

const CreateCustomerSchema = createInsertSchema(schema.customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const UuidParamSchema = z.object({ id: z.string().uuid() });

// ── Router ───────────────────────────────────────────────────────────────────

const router = new OpenAPIHono<{ Bindings: Env }>();

// GET /customers
router.openapi(
  createRoute({
    method: "get",
    path: "/",
    tags: ["customers"],
    summary: "List customers with order stats",
    request: {
      query: z.object({
        search: z.string().optional(),
      }),
    },
    responses: {
      200: {
        content: {
          "application/json": { schema: z.array(CustomerWithStatsSchema) },
        },
        description: "Customers with aggregate order data",
      },
    },
  }),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const { search } = c.req.valid("query");

    // LEFT JOIN so customers with zero orders still appear.
    // sql<number> casts the aggregate return value to number (Postgres SUM returns
    // string by default for large integers to avoid JS precision loss).
    const rows = await db
      .select({
        id: schema.customers.id,
        name: schema.customers.name,
        email: schema.customers.email,
        phone: schema.customers.phone,
        createdAt: schema.customers.createdAt,
        updatedAt: schema.customers.updatedAt,
        orderCount: count(schema.orders.id),
        totalSpend: sql<number>`coalesce(sum(${schema.orders.total}), 0)`,
      })
      .from(schema.customers)
      .leftJoin(schema.orders, eq(schema.orders.customerId, schema.customers.id))
      .where(
        search
          ? or(
              ilike(schema.customers.name, `%${search}%`),
              ilike(schema.customers.email, `%${search}%`),
              ilike(schema.customers.phone, `%${search}%`)
            )
          : undefined
      )
      .groupBy(schema.customers.id)
      .orderBy(desc(schema.customers.createdAt));

    return c.json(rows, 200);
  }
);

// GET /customers/:id
router.openapi(
  createRoute({
    method: "get",
    path: "/{id}",
    tags: ["customers"],
    summary: "Get customer with order history",
    request: { params: UuidParamSchema },
    responses: {
      200: {
        content: { "application/json": { schema: CustomerDetailSchema } },
        description: "Customer detail",
      },
      404: {
        content: { "application/json": { schema: ErrorSchema } },
        description: "Customer not found",
      },
    },
  }),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const { id } = c.req.valid("param");

    // Fetch base customer row + aggregates in one query.
    const [base] = await db
      .select({
        id: schema.customers.id,
        name: schema.customers.name,
        email: schema.customers.email,
        phone: schema.customers.phone,
        createdAt: schema.customers.createdAt,
        updatedAt: schema.customers.updatedAt,
        orderCount: count(schema.orders.id),
        totalSpend: sql<number>`coalesce(sum(${schema.orders.total}), 0)`,
      })
      .from(schema.customers)
      .leftJoin(schema.orders, eq(schema.orders.customerId, schema.customers.id))
      .where(eq(schema.customers.id, id))
      .groupBy(schema.customers.id);

    if (!base) return c.json({ error: "Customer not found" }, 404);

    // Fetch recent orders separately (simpler than a correlated subquery).
    const orders = await db
      .select({
        id: schema.orders.id,
        orderNumber: schema.orders.orderNumber,
        status: schema.orders.status,
        total: schema.orders.total,
        createdAt: schema.orders.createdAt,
      })
      .from(schema.orders)
      .where(eq(schema.orders.customerId, id))
      .orderBy(desc(schema.orders.createdAt))
      .limit(20);

    return c.json({ ...base, orders }, 200);
  }
);

// POST /customers
router.openapi(
  createRoute({
    method: "post",
    path: "/",
    tags: ["customers"],
    summary: "Create a customer",
    request: {
      body: {
        content: { "application/json": { schema: CreateCustomerSchema } },
        required: true,
      },
    },
    responses: {
      201: {
        content: { "application/json": { schema: CustomerSchema } },
        description: "Created customer",
      },
      409: {
        content: { "application/json": { schema: ErrorSchema } },
        description: "Email already exists",
      },
    },
  }),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const body = c.req.valid("json");

    if (body.email) {
      const [existing] = await db
        .select({ id: schema.customers.id })
        .from(schema.customers)
        .where(eq(schema.customers.email, body.email));
      if (existing) return c.json({ error: "A customer with this email already exists" }, 409);
    }

    const [row] = await db.insert(schema.customers).values(body).returning();
    return c.json(row, 201);
  }
);

export { router as customersRouter };
