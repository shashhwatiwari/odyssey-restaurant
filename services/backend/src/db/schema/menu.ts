import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// pgTable() defines a table schema in TypeScript.
// Nothing runs against the database until you generate + run a migration.

export const menuCategories = pgTable("menu_categories", {
  id: uuid("id").primaryKey().defaultRandom(), // defaultRandom() → Postgres gen_random_uuid()
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const menuItems = pgTable(
  "menu_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => menuCategories.id), // .references() creates a FK constraint in the DB
    name: text("name").notNull(),
    description: text("description"), // nullable — not every item needs a description
    price: integer("price").notNull(), // stored in cents ($12.99 → 1299); avoids float precision issues
    isAvailable: boolean("is_available").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // Declared indexes — drizzle-kit includes these in the generated migration SQL.
    categoryIdIdx: index("menu_items_category_id_idx").on(table.categoryId),
  })
);
