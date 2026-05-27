import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../index";

// ── Mock the DB factory ───────────────────────────────────────────────────────
//
// The route handlers call createDb(c.env.DATABASE_URL) inside each request.
// We mock the module so every call returns our fake db object instead of
// opening a real Neon connection. The DATABASE_URL env value is passed via
// app.request()'s third argument and is never actually used.

vi.mock("../db", () => ({ createDb: vi.fn() }));

// Import *after* vi.mock so we get the mocked version.
import { createDb } from "../db";

// ── Drizzle chain mock helpers ────────────────────────────────────────────────
//
// Drizzle update() returns a fluent builder: .set().where().returning().
// We build a minimal fake that satisfies the type the handler needs.

function makeUpdateChain(returning: unknown[]) {
  const returningFn = vi.fn().mockResolvedValue(returning);
  const whereFn = vi.fn(() => ({ returning: returningFn }));
  const setFn = vi.fn(() => ({ where: whereFn }));
  return { update: vi.fn(() => ({ set: setFn })) };
}

// ── Shared test fixtures ──────────────────────────────────────────────────────

const ORDER_ID = "00000000-0000-0000-0000-000000000001";

const BASE_ORDER = {
  id: ORDER_ID,
  orderNumber: 1,
  customerId: "00000000-0000-0000-0000-000000000002",
  status: "pending" as const,
  total: 1299,
  notes: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Helper: make a POST-style request to the Hono app without a real HTTP server.
// app.request() uses the Web Fetch API — available in Node.js 18+ and in Workers.
async function patchStatus(id: string, newStatus: string) {
  return app.request(
    `/orders/${id}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    },
    { DATABASE_URL: "mock" } // env bindings
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("PATCH /orders/:id/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 and the updated order on a valid transition (pending → accepted)", async () => {
    const updatedOrder = { ...BASE_ORDER, status: "accepted" };
    const chain = makeUpdateChain([updatedOrder]);

    vi.mocked(createDb).mockReturnValue({
      query: { orders: { findFirst: vi.fn().mockResolvedValue(BASE_ORDER) } },
      ...chain,
    } as any);

    const res = await patchStatus(ORDER_ID, "accepted");

    expect(res.status).toBe(200);
    const body = await res.json<{ status: string }>();
    expect(body.status).toBe("accepted");
  });

  it("returns 400 when the transition is invalid (pending → completed)", async () => {
    vi.mocked(createDb).mockReturnValue({
      query: { orders: { findFirst: vi.fn().mockResolvedValue(BASE_ORDER) } },
      update: vi.fn(), // never called — handler short-circuits at canTransition check
    } as any);

    const res = await patchStatus(ORDER_ID, "completed");

    expect(res.status).toBe(400);
    const body = await res.json<{ error: string }>();
    expect(body.error).toMatch(/Cannot transition/i);
  });

  it("returns 400 when the order is in a terminal state (cancelled → accepted)", async () => {
    const cancelledOrder = { ...BASE_ORDER, status: "cancelled" };

    vi.mocked(createDb).mockReturnValue({
      query: { orders: { findFirst: vi.fn().mockResolvedValue(cancelledOrder) } },
      update: vi.fn(),
    } as any);

    const res = await patchStatus(ORDER_ID, "accepted");

    expect(res.status).toBe(400);
  });

  it("returns 404 when the order does not exist", async () => {
    vi.mocked(createDb).mockReturnValue({
      query: { orders: { findFirst: vi.fn().mockResolvedValue(undefined) } },
      update: vi.fn(),
    } as any);

    const res = await patchStatus(ORDER_ID, "accepted");

    expect(res.status).toBe(404);
    const body = await res.json<{ error: string }>();
    expect(body.error).toMatch(/not found/i);
  });

  it("returns 400 when status value is not in the enum (gibberish input)", async () => {
    // Hono's zod validation fires before our handler runs, so no db mock needed.
    vi.mocked(createDb).mockReturnValue({
      query: { orders: { findFirst: vi.fn() } },
      update: vi.fn(),
    } as any);

    const res = await patchStatus(ORDER_ID, "flying");

    // @hono/zod-openapi returns 400 for schema validation failures.
    expect(res.status).toBe(400);
  });
});
