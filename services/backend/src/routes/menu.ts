import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { count, eq } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { createDb } from "../db";
import * as schema from "../db/schema";
import { ErrorSchema } from "../lib/schemas";
import type { Env } from "../types";

// ── Schemas ──────────────────────────────────────────────────────────────────

const CategorySchema = createSelectSchema(schema.menuCategories, {
  createdAt: z.string().datetime(),
});

const CreateCategorySchema = createInsertSchema(schema.menuCategories)
  .omit({ id: true, createdAt: true });

const UpdateCategorySchema = CreateCategorySchema.partial();

const MenuItemSchema = createSelectSchema(schema.menuItems, {
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Items in list/detail responses include their parent category for the frontend
// to render grouping without a separate request.
const MenuItemWithCategorySchema = MenuItemSchema.extend({
  category: z.object({ id: z.string().uuid(), name: z.string() }),
});

const CreateMenuItemSchema = createInsertSchema(schema.menuItems)
  .omit({ id: true, createdAt: true, updatedAt: true });

const UpdateMenuItemSchema = CreateMenuItemSchema.partial();

const UuidParamSchema = z.object({ id: z.string().uuid() });

// ── Router ───────────────────────────────────────────────────────────────────

const router = new OpenAPIHono<{ Bindings: Env }>();

// GET /menu/categories
router.openapi(
  createRoute({
    method: "get",
    path: "/categories",
    tags: ["menu"],
    summary: "List menu categories",
    responses: {
      200: {
        content: { "application/json": { schema: z.array(CategorySchema) } },
        description: "All categories ordered by sortOrder",
      },
    },
  }),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const rows = await db.query.menuCategories.findMany({
      orderBy: (t, { asc }) => [asc(t.sortOrder), asc(t.name)],
    });
    return c.json(rows, 200);
  }
);

// POST /menu/categories
router.openapi(
  createRoute({
    method: "post",
    path: "/categories",
    tags: ["menu"],
    summary: "Create a menu category",
    request: {
      body: {
        content: { "application/json": { schema: CreateCategorySchema } },
        required: true,
      },
    },
    responses: {
      201: {
        content: { "application/json": { schema: CategorySchema } },
        description: "Created category",
      },
    },
  }),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const body = c.req.valid("json");
    const [row] = await db.insert(schema.menuCategories).values(body).returning();
    return c.json(row, 201);
  }
);

// PATCH /menu/categories/{id}
router.openapi(
  createRoute({
    method: "patch",
    path: "/categories/{id}",
    tags: ["menu"],
    summary: "Update a menu category",
    request: {
      params: UuidParamSchema,
      body: {
        content: { "application/json": { schema: UpdateCategorySchema } },
        required: true,
      },
    },
    responses: {
      200: {
        content: { "application/json": { schema: CategorySchema } },
        description: "Updated category",
      },
      404: {
        content: { "application/json": { schema: ErrorSchema } },
        description: "Category not found",
      },
    },
  }),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const [row] = await db
      .update(schema.menuCategories)
      .set(body)
      .where(eq(schema.menuCategories.id, id))
      .returning();
    if (!row) return c.json({ error: "Category not found" }, 404);
    return c.json(row, 200);
  }
);

// DELETE /menu/categories/{id}
router.openapi(
  createRoute({
    method: "delete",
    path: "/categories/{id}",
    tags: ["menu"],
    summary: "Delete a menu category",
    request: { params: UuidParamSchema },
    responses: {
      204: { description: "Deleted" },
      400: {
        content: { "application/json": { schema: ErrorSchema } },
        description: "Category still has items",
      },
      404: {
        content: { "application/json": { schema: ErrorSchema } },
        description: "Category not found",
      },
    },
  }),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const { id } = c.req.valid("param");

    const [existing] = await db
      .select({ id: schema.menuCategories.id })
      .from(schema.menuCategories)
      .where(eq(schema.menuCategories.id, id));
    if (!existing) return c.json({ error: "Category not found" }, 404);

    // Prevent deleting categories that still own menu items (FK would throw anyway,
    // but a clear 400 is friendlier than a 500 with a Postgres error message).
    const [{ itemCount }] = await db
      .select({ itemCount: count(schema.menuItems.id) })
      .from(schema.menuItems)
      .where(eq(schema.menuItems.categoryId, id));
    if (itemCount > 0)
      return c.json({ error: "Remove all items in this category before deleting it" }, 400);

    await db.delete(schema.menuCategories).where(eq(schema.menuCategories.id, id));
    return new Response(null, { status: 204 });
  }
);

// GET /menu/items
router.openapi(
  createRoute({
    method: "get",
    path: "/items",
    tags: ["menu"],
    summary: "List menu items",
    request: {
      query: z.object({
        categoryId: z.string().uuid().optional(),
        available: z
          .enum(["true", "false"])
          .optional()
          .transform((v) => (v === undefined ? undefined : v === "true")),
      }),
    },
    responses: {
      200: {
        content: {
          "application/json": { schema: z.array(MenuItemWithCategorySchema) },
        },
        description: "Menu items with category info",
      },
    },
  }),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const { categoryId, available } = c.req.valid("query");
    const rows = await db.query.menuItems.findMany({
      with: { category: { columns: { id: true, name: true } } },
      where: (t, { eq, and }) =>
        and(
          categoryId ? eq(t.categoryId, categoryId) : undefined,
          available !== undefined ? eq(t.isAvailable, available) : undefined
        ),
      orderBy: (t, { asc }) => [asc(t.sortOrder), asc(t.name)],
    });
    return c.json(rows, 200);
  }
);

// POST /menu/items
router.openapi(
  createRoute({
    method: "post",
    path: "/items",
    tags: ["menu"],
    summary: "Create a menu item",
    request: {
      body: {
        content: { "application/json": { schema: CreateMenuItemSchema } },
        required: true,
      },
    },
    responses: {
      201: {
        content: { "application/json": { schema: MenuItemSchema } },
        description: "Created item",
      },
      404: {
        content: { "application/json": { schema: ErrorSchema } },
        description: "Category not found",
      },
    },
  }),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const body = c.req.valid("json");

    const [cat] = await db
      .select({ id: schema.menuCategories.id })
      .from(schema.menuCategories)
      .where(eq(schema.menuCategories.id, body.categoryId));
    if (!cat) return c.json({ error: "Category not found" }, 404);

    const [row] = await db.insert(schema.menuItems).values(body).returning();
    return c.json(row, 201);
  }
);

// PATCH /menu/items/{id}
router.openapi(
  createRoute({
    method: "patch",
    path: "/items/{id}",
    tags: ["menu"],
    summary: "Update a menu item",
    request: {
      params: UuidParamSchema,
      body: {
        content: { "application/json": { schema: UpdateMenuItemSchema } },
        required: true,
      },
    },
    responses: {
      200: {
        content: { "application/json": { schema: MenuItemSchema } },
        description: "Updated item",
      },
      404: {
        content: { "application/json": { schema: ErrorSchema } },
        description: "Item not found",
      },
    },
  }),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const [row] = await db
      .update(schema.menuItems)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(schema.menuItems.id, id))
      .returning();
    if (!row) return c.json({ error: "Menu item not found" }, 404);
    return c.json(row, 200);
  }
);

// DELETE /menu/items/{id}
router.openapi(
  createRoute({
    method: "delete",
    path: "/items/{id}",
    tags: ["menu"],
    summary: "Delete a menu item",
    request: { params: UuidParamSchema },
    responses: {
      204: { description: "Deleted" },
      400: {
        content: { "application/json": { schema: ErrorSchema } },
        description: "Item has been ordered — cannot delete",
      },
      404: {
        content: { "application/json": { schema: ErrorSchema } },
        description: "Item not found",
      },
    },
  }),
  async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const { id } = c.req.valid("param");

    const [existing] = await db
      .select({ id: schema.menuItems.id })
      .from(schema.menuItems)
      .where(eq(schema.menuItems.id, id));
    if (!existing) return c.json({ error: "Menu item not found" }, 404);

    const [{ usageCount }] = await db
      .select({ usageCount: count(schema.orderItems.id) })
      .from(schema.orderItems)
      .where(eq(schema.orderItems.menuItemId, id));
    if (usageCount > 0)
      return c.json({ error: "Cannot delete an item that appears in existing orders" }, 400);

    await db.delete(schema.menuItems).where(eq(schema.menuItems.id, id));
    return new Response(null, { status: 204 });
  }
);

export { router as menuRouter };
