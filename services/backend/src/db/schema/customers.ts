import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  // email is nullable — walk-in customers may only provide a phone number.
  // unique() on a nullable column is valid in Postgres: multiple NULLs are allowed,
  // but two rows cannot share the same non-null email address.
  email: text("email").unique(),
  phone: text("phone"), // nullable — either email or phone (or both) is sufficient
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
