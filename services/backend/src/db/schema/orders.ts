import {
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { customers } from "./customers";
import { menuItems } from "./menu";

// pgEnum creates a native Postgres enum type — not just a CHECK constraint.
// Postgres enforces the allowed values at the DB level, and the type appears
// in the generated OpenAPI schema via drizzle-zod, which Orval then picks up.
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "accepted",
  "rejected",
  "preparing",
  "cancelled",
  "ready",
  "completed",
]);

export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];

// Valid next states for each status. Backend uses this to reject illegal transitions.
// terminal states map to [] — no further transitions allowed.
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["accepted", "rejected"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed"],
  rejected: [],
  cancelled: [],
  completed: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // serial is a Postgres auto-incrementing integer — gives human-readable "Order #47"
    // rather than exposing a UUID in the UI. The UUID stays the primary key.
    orderNumber: serial("order_number").notNull().unique(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id),
    status: orderStatusEnum("status").notNull().default("pending"),
    total: integer("total").notNull(), // cents; server-calculates from order_items on create
    notes: text("notes"), // optional customer instructions
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    customerIdIdx: index("orders_customer_id_idx").on(table.customerId),
    statusIdx: index("orders_status_idx").on(table.status),
    createdAtIdx: index("orders_created_at_idx").on(table.createdAt),
  })
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id),
    menuItemId: uuid("menu_item_id")
      .notNull()
      .references(() => menuItems.id),
    quantity: integer("quantity").notNull(),
    // unitPrice snapshots the menu item price at the moment the order is placed.
    // If the menu item price changes later, this order's total stays correct.
    unitPrice: integer("unit_price").notNull(), // cents
    subtotal: integer("subtotal").notNull(), // cents; quantity × unit_price, server-calculated
  },
  (table) => ({
    orderIdIdx: index("order_items_order_id_idx").on(table.orderId),
  })
);
