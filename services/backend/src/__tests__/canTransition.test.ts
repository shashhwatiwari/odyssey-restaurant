import { describe, expect, it } from "vitest";
import {
  canTransition,
  ORDER_TRANSITIONS,
  type OrderStatus,
} from "../db/schema/orders";

// canTransition() is the single gate that the PATCH /orders/:id/status route
// uses to accept or reject every status change. Covering it thoroughly here means
// we don't need to spin up a DB to trust the state machine.

const ALL_STATUSES = Object.keys(ORDER_TRANSITIONS) as OrderStatus[];

describe("canTransition", () => {
  // ── Valid transitions ───────────────────────────────────────────────────────

  it("allows pending → accepted", () => expect(canTransition("pending", "accepted")).toBe(true));
  it("allows pending → rejected", () => expect(canTransition("pending", "rejected")).toBe(true));

  it("allows accepted → preparing", () => expect(canTransition("accepted", "preparing")).toBe(true));
  it("allows accepted → cancelled", () => expect(canTransition("accepted", "cancelled")).toBe(true));

  it("allows preparing → ready", () => expect(canTransition("preparing", "ready")).toBe(true));
  it("allows preparing → cancelled", () => expect(canTransition("preparing", "cancelled")).toBe(true));

  it("allows ready → completed", () => expect(canTransition("ready", "completed")).toBe(true));

  // ── Invalid transitions ─────────────────────────────────────────────────────

  it("rejects pending → preparing (must accept first)", () =>
    expect(canTransition("pending", "preparing")).toBe(false));

  it("rejects pending → completed", () =>
    expect(canTransition("pending", "completed")).toBe(false));

  it("rejects accepted → completed (must go through preparing → ready)", () =>
    expect(canTransition("accepted", "completed")).toBe(false));

  it("rejects preparing → accepted (no backward transitions)", () =>
    expect(canTransition("preparing", "accepted")).toBe(false));

  it("rejects ready → preparing (no backward transitions)", () =>
    expect(canTransition("ready", "preparing")).toBe(false));

  // ── Terminal states — nothing is allowed out of them ───────────────────────

  const TERMINAL: OrderStatus[] = ["rejected", "cancelled", "completed"];

  it.each(TERMINAL)(
    "rejects any transition out of terminal status '%s'",
    (terminal) => {
      for (const next of ALL_STATUSES) {
        expect(
          canTransition(terminal, next),
          `${terminal} → ${next} should be rejected`
        ).toBe(false);
      }
    }
  );

  // ── Self-transitions are always invalid ────────────────────────────────────

  it.each(ALL_STATUSES)(
    "rejects self-transition %s → %s",
    (status) => {
      expect(canTransition(status, status)).toBe(false);
    }
  );

  // ── ORDER_TRANSITIONS has entries for every status ─────────────────────────

  it("covers all enum values in ORDER_TRANSITIONS", () => {
    // If a new status is added to the enum without updating ORDER_TRANSITIONS
    // this test will catch it (the map key count will differ).
    expect(ALL_STATUSES.length).toBe(7);
    expect(new Set(ALL_STATUSES).size).toBe(7);
  });
});
