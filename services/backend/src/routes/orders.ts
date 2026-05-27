import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { desc, eq, inArray } from "drizzle-orm";
import { createSelectSchema } from "drizzle-zod";
import { createDb } from "../db";
import * as schema from "../db/schema";
import { canTransition } from "../db/schema/orders";
import { ErrorSchema } from "../lib/schemas";
import type { Env } from "../types";

// ── Schemas ──────────────────────────────────────────────────────────────────

const OrderSchema = createSelectSchema(schema.orders, {
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const CustomerRefSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

const MenuItemRefSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

const OrderItemSchema = createSelectSchema(schema.orderItems).extend({
  menuItem: MenuItemRefSchema,
});

// List response: order + customer name. Items are fetched separately on detail.
const OrderSummarySchema = OrderSchema.extend({ customer: CustomerRefSchema });

// Detail response: order + customer + full line items with menu item names.
const OrderDetailSchema = OrderSchema.extend({
  customer: CustomerRefSchema,
  items: z.array(OrderItemSchema),
});

// POST /orders request body. Client sends menuItemId + quantity;
// server resolves price, calculates subtotal and total.
const CreateOrderSchema = z.object({
  customerId: z.string().uuid(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().uuid(),
        quantity: z.number().int().min(1),
      })
    )
    .min(1, "An order must have at least one item"),
});

// PATCH /orders/:id/status — only the target status is accepted;
// the backend decides if the transition is valid.
const UpdateStatusSchema = z.object({
  status: z.enum(schema.orderStatusEnum.enumValues),
});

const UuidParamSchema = z.object({ id: z.string().uuid() });

// ── Router ───────────────────────────────────────────────────────────────────

const router = new OpenAPIHono<{ Bindings: Env }>();

// GET /orders
router.openapi(
  createRoute({
    method: "get",
    path: "/",
    tags: ["orders"],
    summary: "List orders",
    request: {
      query: z.object({
        status: z.enum(schema.orderStatusEnum.enumValues).optional(),
        customerId: z.string().uuid().optional(),
      }),
    },
    responses: {
      200: {
        content: {
          "application/json": { schema: z.array(OrderSummarySchema) },
        },
        description: "Orders with customer info, newest first",
      },
    },
  }),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const { status, customerId } = c.req.valid("query");

    const rows = await db.query.orders.findMany({
      with: { customer: { columns: { id: true, name: true } } },
      where: (t, { eq, and }) =>
        and(
          status ? eq(t.status, status) : undefined,
          customerId ? eq(t.customerId, customerId) : undefined
        ),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });

    return c.json(rows, 200);
  }
);

// POST /orders
router.openapi(
  createRoute({
    method: "post",
    path: "/",
    tags: ["orders"],
    summary: "Create an order",
    request: {
      body: {
        content: { "application/json": { schema: CreateOrderSchema } },
        required: true,
      },
    },
    responses: {
      201: {
        content: { "application/json": { schema: OrderDetailSchema } },
        description: "Created order with line items",
      },
      400: {
        content: { "application/json": { schema: ErrorSchema } },
        description: "Validation error (unavailable item, bad payload)",
      },
      404: {
        content: { "application/json": { schema: ErrorSchema } },
        description: "Customer or menu item not found",
      },
    },
  }),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const body = c.req.valid("json");

    // 1. Validate customer exists.
    const customer = await db.query.customers.findFirst({
      where: eq(schema.customers.id, body.customerId),
    });
    if (!customer) return c.json({ error: "Customer not found" }, 404);

    // 2. Fetch all requested menu items in one query.
    const menuItemIds = body.items.map((i) => i.menuItemId);
    const fetchedItems = await db.query.menuItems.findMany({
      where: inArray(schema.menuItems.id, menuItemIds),
    });

    if (fetchedItems.length !== menuItemIds.length) {
      return c.json({ error: "One or more menu items not found" }, 404);
    }

    const unavailable = fetchedItems.filter((i) => !i.isAvailable);
    if (unavailable.length > 0) {
      return c.json(
        { error: `"${unavailable[0].name}" is currently unavailable` },
        400
      );
    }

    // 3. Build line items and calculate total. We snapshot unit_price from the
    //    current menu item price so future price changes don't alter this order.
    const itemMap = new Map(fetchedItems.map((i) => [i.id, i]));
    const lineItems = body.items.map((line) => {
      const menuItem = itemMap.get(line.menuItemId)!;
      return {
        menuItemId: line.menuItemId,
        quantity: line.quantity,
        unitPrice: menuItem.price,
        subtotal: menuItem.price * line.quantity,
      };
    });
    const total = lineItems.reduce((sum, l) => sum + l.subtotal, 0);

    // 4. Get settings for auto_accept.
    const currentSettings = await db.query.settings.findFirst();
    const initialStatus = currentSettings?.autoAccept ? "accepted" : "pending";

    // 5. Insert order + items.
    const [order] = await db
      .insert(schema.orders)
      .values({
        customerId: body.customerId,
        status: initialStatus,
        total,
        notes: body.notes ?? null,
      })
      .returning();

    await db
      .insert(schema.orderItems)
      .values(lineItems.map((l) => ({ ...l, orderId: order.id })));

    // 6. Return full detail (matches OrderDetailSchema).
    const detail = await db.query.orders.findFirst({
      where: eq(schema.orders.id, order.id),
      with: {
        customer: { columns: { id: true, name: true } },
        items: { with: { menuItem: { columns: { id: true, name: true } } } },
      },
    });

    return c.json(detail!, 201);
  }
);

// GET /orders/:id
router.openapi(
  createRoute({
    method: "get",
    path: "/{id}",
    tags: ["orders"],
    summary: "Get order detail",
    request: { params: UuidParamSchema },
    responses: {
      200: {
        content: { "application/json": { schema: OrderDetailSchema } },
        description: "Full order with items and customer",
      },
      404: {
        content: { "application/json": { schema: ErrorSchema } },
        description: "Order not found",
      },
    },
  }),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const { id } = c.req.valid("param");

    const row = await db.query.orders.findFirst({
      where: eq(schema.orders.id, id),
      with: {
        customer: { columns: { id: true, name: true } },
        items: { with: { menuItem: { columns: { id: true, name: true } } } },
      },
    });

    if (!row) return c.json({ error: "Order not found" }, 404);
    return c.json(row, 200);
  }
);

// PATCH /orders/:id/status
router.openapi(
  createRoute({
    method: "patch",
    path: "/{id}/status",
    tags: ["orders"],
    summary: "Update order status",
    description:
      "Enforces valid state transitions. See ORDER_TRANSITIONS in schema/orders.ts.",
    request: {
      params: UuidParamSchema,
      body: {
        content: { "application/json": { schema: UpdateStatusSchema } },
        required: true,
      },
    },
    responses: {
      200: {
        content: { "application/json": { schema: OrderSchema } },
        description: "Updated order",
      },
      400: {
        content: { "application/json": { schema: ErrorSchema } },
        description: "Invalid status transition",
      },
      404: {
        content: { "application/json": { schema: ErrorSchema } },
        description: "Order not found",
      },
    },
  }),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const { id } = c.req.valid("param");
    const { status: newStatus } = c.req.valid("json");

    const order = await db.query.orders.findFirst({
      where: eq(schema.orders.id, id),
    });
    if (!order) return c.json({ error: "Order not found" }, 404);

    // canTransition() is defined alongside the ORDER_TRANSITIONS map in schema/orders.ts.
    // It returns false for invalid moves and for all terminal states.
    if (!canTransition(order.status, newStatus)) {
      return c.json(
        { error: `Cannot transition from "${order.status}" to "${newStatus}"` },
        400
      );
    }

    const [updated] = await db
      .update(schema.orders)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(schema.orders.id, id))
      .returning();

    return c.json(updated, 200);
  }
);

export { router as ordersRouter };
