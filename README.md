# Odyssey Restaurant Dashboard

A fullstack restaurant operations dashboard built as a take-home engineering assignment.

## Stack

| Layer | Technology |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Frontend | Expo (React Native Web) + Expo Router |
| Backend | Hono on Cloudflare Workers |
| Database | PostgreSQL via Neon (serverless HTTP driver) |
| ORM | Drizzle ORM + drizzle-zod |
| API contract | `@hono/zod-openapi` → OpenAPI spec → Orval-generated React Query v5 hooks |
| Tests | Vitest (backend), Jest + jest-expo (frontend) |

## Project structure

```
Ody/
├── apps/
│   └── dashboard/          # Expo web app (React Native Web)
├── services/
│   └── backend/            # Hono Worker: routes, DB schema, seed
└── packages/
    ├── api-client/         # Orval-generated hooks + axiosInstance mutator
    ├── shared/             # Shared utilities (stub, ready to extend)
    └── types/              # Shared type exports (stub, ready to extend)
```

## Prerequisites

- Node.js 18+
- pnpm 9.12.0 — install with `npm i -g pnpm@9.12.0` or via corepack
- A free [Neon](https://neon.tech) project (provides a PostgreSQL connection string)

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

**Backend** — copy and fill in your Neon connection string:

```bash
cp services/backend/.dev.vars.example services/backend/.dev.vars
# Edit services/backend/.dev.vars and set DATABASE_URL=postgresql://...
```

**Frontend** — copy the root env file:

```bash
cp .env.example .env
# EXPO_PUBLIC_API_URL defaults to http://localhost:8787, which is correct for local dev
```

### 3. Push the schema to Neon

This creates the tables in your Neon database from the Drizzle schema definitions.

```bash
pnpm --filter @ody/backend run db:push
```

> Use `db:push` for first-time setup. Use `db:generate` + `db:migrate` for subsequent schema changes so you get tracked migration files.

### 4. Seed sample data

Inserts 4 menu categories, 13 menu items, 5 customers, and 8 orders spread across every order status.

```bash
pnpm --filter @ody/backend run db:seed
```

Safe to re-run — it clears all tables first in FK-safe order.

### 5. Start development servers

In two separate terminals:

```bash
# Terminal 1 — Hono backend on http://localhost:8787
pnpm dev:backend

# Terminal 2 — Expo web dashboard on http://localhost:8081
pnpm dev:dashboard
```

Open [http://localhost:8081](http://localhost:8081) in a browser.

## API contract pipeline

The frontend never manually writes types for backend data. The flow is:

```
Drizzle schema (orders.ts)
  → drizzle-zod createSelectSchema()
    → @hono/zod-openapi route definition
      → app.getOpenAPIDocument() in export-spec.ts
        → openapi.json (committed to packages/api-client/)
          → Orval reads it → generates hooks + types into packages/api-client/src/generated/
            → dashboard imports from @ody/api-client
```

To regenerate the client after changing a route or schema:

```bash
pnpm gen:contract
```

This runs `export:spec` (Node.js script that imports the Hono app object and calls `getOpenAPIDocument()` — no server needed) then Orval. Never hand-edit anything in `packages/api-client/src/generated/`.

The generated directory is gitignored; `openapi.json` is committed so reviewers can inspect the contract without running the backend.

## Running tests

```bash
# All packages in parallel (via Turborepo)
pnpm test

# Backend only (Vitest)
pnpm --filter @ody/backend run test

# Frontend only (Jest + jest-expo)
pnpm --filter @ody/dashboard run test
```

**Backend tests** (28 tests, 2 files):
- `canTransition.test.ts` — unit tests for the entire order state machine: every valid transition, every invalid transition, all terminal states exhaustively, self-transitions
- `ordersRoute.test.ts` — integration tests for `PATCH /orders/:id/status` using Hono's `app.request()` with a mocked Drizzle chain; no live DB required

**Frontend tests** (23 tests, 3 files):
- `format.test.ts` — `formatPrice` (cents → dollars), `formatOrderNumber` (zero-padding), `formatRelativeTime` (minutes/hours/date branches)
- `Button.test.tsx` — `onPress` fires, blocked when disabled/loading, `ActivityIndicator` present/absent
- `Badge.test.tsx` — all 7 order statuses render; each gets the correct `backgroundColor` from design tokens

## Dashboard pages

| Route | Description |
|---|---|
| `/` | KPI cards (orders, revenue, pending count) + top items table |
| `/orders` | Full orders table with status filter; click any row for detail + status update |
| `/crm` | Customer list with order count and total spend; click for recent order history |
| `/menu` | Items grouped by category with availability toggle; add-item form |
| `/settings` | Toggle auto-accept, service availability, prep time, opening/closing hours |
| `/ui-library` | Design system showcase — every component and token documented |

## Architecture decisions

### Why Neon over a local database?

Cloudflare Workers run in a V8 isolate — they cannot open TCP connections, which rules out a standard Postgres client. Neon's serverless driver (`@neondatabase/serverless`) uses HTTP fetch, which is natively available in Workers. No `nodejs_compat` flag needed, no connection pooler setup required.

### Why `createDb()` is called per-request, not at module level

Workers env bindings (`c.env.DATABASE_URL`) only exist inside the request handler. Code at module level runs during the cold-start phase before any request arrives, so the binding is `undefined` there. Every route handler calls `createDb(c.env.DATABASE_URL)` at the top. The Neon HTTP client is cheap to construct — there is no persistent TCP connection to manage.

### Money in cents

All prices are stored as integers (e.g. $12.99 → `1299`). Floating-point arithmetic on currency values accumulates rounding errors; integer cent arithmetic does not. The `formatPrice(cents)` utility in `apps/dashboard/utils/format.ts` is the single place that divides by 100 for display.

### Order state machine

```
pending ──→ accepted ──→ preparing ──→ ready ──→ completed
         ↘ rejected    ↘ cancelled   ↘ cancelled
```

`ORDER_TRANSITIONS` (a `Record<OrderStatus, OrderStatus[]>` map) and `canTransition(from, to)` live in `services/backend/src/db/schema/orders.ts`, colocated with the enum. The `PATCH /orders/:id/status` handler calls `canTransition()` before every update; an invalid move returns a 400 with a descriptive message. The frontend mirrors this map only for rendering which buttons to show — the server remains the sole enforcement point.

### Settings singleton

The `settings` table always has exactly one row (`id = 1`). This is enforced by a Postgres `CHECK (id = 1)` constraint so no application code can accidentally insert a second row. The `PATCH /settings` route uses an upsert (`onConflictDoUpdate`) that always targets `id = 1`.

### OpenAPI path notation

Hono's router uses `:id` for URL params, but `@hono/zod-openapi`'s `createRoute()` requires OpenAPI notation `{id}`. All route definitions use `{id}`; Hono's OpenAPI adapter translates these to `:id` internally when registering handlers.

### Monorepo Metro resolution

Metro (the Expo bundler) is not workspace-aware by default. `apps/dashboard/metro.config.js` adds `watchFolders: [workspaceRoot]` so Metro can see `packages/*` source files, and `resolver.nodeModulesPaths` pointing at both the app's own `node_modules` and the workspace root's `node_modules` for transitive dependencies.

### Hours as integers

Opening and closing hours are stored as integers `0–23` (hour of the 24-hour clock). A proper implementation would store `time` or `timetz` values, but integer hours are sufficient for the operations dashboard scope and avoid timezone complexity in the DB layer.

### Price snapshot in order items

`order_items.unit_price` copies the menu item price at the moment the order is placed. If the menu item price is later changed, historical order totals remain accurate. This is a standard "event sourcing lite" pattern for order management systems.
