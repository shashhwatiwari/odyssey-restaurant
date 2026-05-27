import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  integer,
  pgTable,
  timestamp,
} from "drizzle-orm/pg-core";

export const settings = pgTable(
  "settings",
  {
    // id is always 1 — this is a singleton row. The CHECK constraint below enforces
    // this at the database level rather than relying on application-layer convention.
    id: integer("id").primaryKey().default(1),
    prepTimeMinutes: integer("prep_time_minutes").notNull().default(20),
    autoAccept: boolean("auto_accept").notNull().default(false),
    serviceAvailable: boolean("service_available").notNull().default(true),
    // Hours are stored as integers 0–23. Known limitation: doesn't handle restaurants
    // open past midnight (e.g. closing at 2am). Acceptable for this assignment scope;
    // noted in architecture docs.
    openingHour: integer("opening_hour").notNull().default(9),
    closingHour: integer("closing_hour").notNull().default(22),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // check() adds a Postgres CHECK constraint — the DB will reject any INSERT or UPDATE
    // that tries to set id to anything other than 1, making the singleton invariant explicit.
    singletonCheck: check("settings_singleton", sql`${table.id} = 1`),
  })
);
