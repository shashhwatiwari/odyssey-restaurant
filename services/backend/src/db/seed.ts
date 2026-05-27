// Seed script — populates the database with realistic sample data for local review.
//
// Run once after `pnpm db:push` (or `pnpm db:migrate`):
//   pnpm --filter @ody/backend run db:seed
//
// Safe to re-run: clears all tables first in FK-safe order.

import { config } from "dotenv";
// Must call config() before any code that reads process.env.DATABASE_URL.
// dotenv parses .dev.vars (same KEY=VALUE format as .env) and sets process.env.
config({ path: ".dev.vars" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log("🌱 Seeding database...");

  // Clear in reverse FK order so constraints don't block deletes.
  await db.delete(schema.orderItems);
  await db.delete(schema.orders);
  await db.delete(schema.menuItems);
  await db.delete(schema.menuCategories);
  await db.delete(schema.customers);
  await db.delete(schema.settings);

  // ── Settings (singleton, id = 1) ────────────────────────────────────────────
  await db.insert(schema.settings).values({
    id: 1,
    prepTimeMinutes: 20,
    autoAccept: false,
    serviceAvailable: true,
    openingHour: 9,
    closingHour: 22,
  });
  console.log("  ✓ settings");

  // ── Menu categories ──────────────────────────────────────────────────────────
  const [starters, mains, desserts, drinks] = await db
    .insert(schema.menuCategories)
    .values([
      { name: "Starters", sortOrder: 1 },
      { name: "Main Courses", sortOrder: 2 },
      { name: "Desserts", sortOrder: 3 },
      { name: "Drinks", sortOrder: 4 },
    ])
    .returning();
  console.log("  ✓ menu categories");

  // ── Menu items ───────────────────────────────────────────────────────────────
  // Prices are in cents: $12.99 → 1299
  const menuItemRows = await db
    .insert(schema.menuItems)
    .values([
      // Starters
      {
        categoryId: starters.id,
        name: "Garlic Bread",
        description: "Toasted sourdough with roasted garlic butter",
        price: 699,
        isAvailable: true,
        sortOrder: 1,
      },
      {
        categoryId: starters.id,
        name: "Bruschetta",
        description: "Grilled bread with fresh tomatoes, basil, and olive oil",
        price: 900,
        isAvailable: true,
        sortOrder: 2,
      },
      {
        categoryId: starters.id,
        name: "Soup of the Day",
        description: "Ask your server for today's selection",
        price: 850,
        isAvailable: true,
        sortOrder: 3,
      },
      // Mains
      {
        categoryId: mains.id,
        name: "Grilled Salmon",
        description: "Atlantic salmon with lemon butter sauce and seasonal veg",
        price: 2400,
        isAvailable: true,
        sortOrder: 1,
      },
      {
        categoryId: mains.id,
        name: "Chicken Parmesan",
        description:
          "Breaded chicken breast, marinara, melted mozzarella, pasta",
        price: 1900,
        isAvailable: true,
        sortOrder: 2,
      },
      {
        categoryId: mains.id,
        name: "Margherita Pizza",
        description: "San Marzano tomato, fior di latte, fresh basil",
        price: 1600,
        isAvailable: true,
        sortOrder: 3,
      },
      {
        categoryId: mains.id,
        name: "Beef Burger",
        description: "8oz chuck patty, aged cheddar, lettuce, tomato, fries",
        price: 1800,
        isAvailable: true,
        sortOrder: 4,
      },
      {
        categoryId: mains.id,
        name: "Pasta Carbonara",
        description: "Spaghetti, guanciale, egg yolk, Pecorino Romano",
        price: 1700,
        isAvailable: true,
        sortOrder: 5,
      },
      // Desserts
      {
        categoryId: desserts.id,
        name: "Tiramisu",
        description: "Classic Italian with espresso-soaked ladyfingers",
        price: 800,
        isAvailable: true,
        sortOrder: 1,
      },
      {
        categoryId: desserts.id,
        name: "Chocolate Lava Cake",
        description: "Warm dark chocolate fondant with vanilla ice cream",
        price: 950,
        isAvailable: true,
        sortOrder: 2,
      },
      // Drinks
      {
        categoryId: drinks.id,
        name: "Still Water",
        description: "500ml bottle",
        price: 250,
        isAvailable: true,
        sortOrder: 1,
      },
      {
        categoryId: drinks.id,
        name: "Orange Juice",
        description: "Freshly squeezed",
        price: 450,
        isAvailable: true,
        sortOrder: 2,
      },
      {
        categoryId: drinks.id,
        name: "House Wine",
        description: "175ml glass — ask for today's selection",
        price: 900,
        isAvailable: true,
        sortOrder: 3,
      },
    ])
    .returning();
  console.log("  ✓ menu items");

  // Build a name→row lookup for readable order construction below.
  const item = (name: string) => {
    const found = menuItemRows.find((r) => r.name === name);
    if (!found) throw new Error(`Menu item not found: ${name}`);
    return found;
  };

  // ── Customers ────────────────────────────────────────────────────────────────
  const [alice, bob, carol, david, emma] = await db
    .insert(schema.customers)
    .values([
      { name: "Alice Johnson", email: "alice@example.com", phone: null },
      { name: "Bob Smith", email: null, phone: "+1 555 0102" }, // phone-only walk-in
      {
        name: "Carol Williams",
        email: "carol@example.com",
        phone: "+1 555 0103",
      },
      { name: "David Brown", email: "david@example.com", phone: null },
      { name: "Emma Davis", email: "emma@example.com", phone: "+1 555 0105" },
    ])
    .returning();
  console.log("  ✓ customers");

  // ── Orders ───────────────────────────────────────────────────────────────────
  // Helper: calculates total from line items and inserts order + order_items together.
  async function createOrder(params: {
    customer: (typeof schema.customers.$inferSelect);
    status: schema.OrderStatus;
    notes?: string;
    lines: Array<{ menuItem: typeof menuItemRows[0]; quantity: number }>;
  }) {
    const lineValues = params.lines.map((l) => ({
      menuItemId: l.menuItem.id,
      quantity: l.quantity,
      unitPrice: l.menuItem.price,
      subtotal: l.menuItem.price * l.quantity,
    }));

    const total = lineValues.reduce((sum, l) => sum + l.subtotal, 0);

    const [order] = await db
      .insert(schema.orders)
      .values({
        customerId: params.customer.id,
        status: params.status,
        total,
        notes: params.notes ?? null,
      })
      .returning();

    await db.insert(schema.orderItems).values(
      lineValues.map((l) => ({ ...l, orderId: order.id }))
    );

    return order;
  }

  await createOrder({
    customer: alice,
    status: "completed",
    lines: [
      { menuItem: item("Grilled Salmon"), quantity: 1 },
      { menuItem: item("Garlic Bread"), quantity: 2 },
      { menuItem: item("House Wine"), quantity: 1 },
    ],
  });

  await createOrder({
    customer: bob,
    status: "completed",
    lines: [
      { menuItem: item("Beef Burger"), quantity: 1 },
      { menuItem: item("Still Water"), quantity: 1 },
    ],
  });

  await createOrder({
    customer: carol,
    status: "completed",
    lines: [
      { menuItem: item("Margherita Pizza"), quantity: 1 },
      { menuItem: item("Bruschetta"), quantity: 1 },
      { menuItem: item("Tiramisu"), quantity: 2 },
    ],
  });

  await createOrder({
    customer: david,
    status: "ready",
    lines: [
      { menuItem: item("Chicken Parmesan"), quantity: 2 },
      { menuItem: item("Orange Juice"), quantity: 2 },
    ],
  });

  await createOrder({
    customer: emma,
    status: "preparing",
    notes: "Extra sauce on the side please",
    lines: [
      { menuItem: item("Pasta Carbonara"), quantity: 1 },
      { menuItem: item("Chocolate Lava Cake"), quantity: 1 },
      { menuItem: item("House Wine"), quantity: 2 },
    ],
  });

  await createOrder({
    customer: alice,
    status: "accepted",
    lines: [
      { menuItem: item("Soup of the Day"), quantity: 1 },
      { menuItem: item("Grilled Salmon"), quantity: 1 },
    ],
  });

  await createOrder({
    customer: carol,
    status: "pending",
    notes: "Gluten-free if possible",
    lines: [
      { menuItem: item("Beef Burger"), quantity: 2 },
      { menuItem: item("Still Water"), quantity: 2 },
    ],
  });

  await createOrder({
    customer: bob,
    status: "rejected",
    lines: [{ menuItem: item("Garlic Bread"), quantity: 3 }],
  });

  console.log("  ✓ orders + order items");
  console.log("✅ Seed complete.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
