import { formatOrderNumber, formatPrice, formatRelativeTime } from "../../utils/format";

describe("formatPrice", () => {
  it("converts cents to a dollar string", () => {
    expect(formatPrice(1299)).toBe("$12.99");
  });

  it("pads a single cent correctly", () => {
    expect(formatPrice(1)).toBe("$0.01");
  });

  it("formats whole dollars with .00", () => {
    expect(formatPrice(500)).toBe("$5.00");
  });

  it("handles zero", () => {
    expect(formatPrice(0)).toBe("$0.00");
  });

  it("handles large amounts", () => {
    expect(formatPrice(100000)).toBe("$1000.00");
  });
});

describe("formatOrderNumber", () => {
  it("zero-pads to 3 digits", () => {
    expect(formatOrderNumber(7)).toBe("#007");
  });

  it("two-digit number", () => {
    expect(formatOrderNumber(42)).toBe("#042");
  });

  it("three-digit number needs no padding", () => {
    expect(formatOrderNumber(100)).toBe("#100");
  });

  it("numbers over 999 are not truncated", () => {
    expect(formatOrderNumber(1000)).toBe("#1000");
  });
});

describe("formatRelativeTime", () => {
  const NOW = new Date("2026-01-01T12:00:00Z").getTime();

  beforeEach(() => {
    // Pin Date.now() so the output is deterministic.
    jest.spyOn(Date, "now").mockReturnValue(NOW);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows minutes for timestamps < 1 hour ago", () => {
    const thirtyMinsAgo = new Date(NOW - 30 * 60_000).toISOString();
    expect(formatRelativeTime(thirtyMinsAgo)).toBe("30m ago");
  });

  it("shows hours for timestamps 1–23 hours ago", () => {
    const threeHoursAgo = new Date(NOW - 3 * 3_600_000).toISOString();
    expect(formatRelativeTime(threeHoursAgo)).toBe("3h ago");
  });

  it("shows a date string for timestamps older than 24 hours", () => {
    const twoDaysAgo = new Date(NOW - 2 * 24 * 3_600_000).toISOString();
    // Don't assert the exact locale string — just that it's not an "ago" format.
    expect(formatRelativeTime(twoDaysAgo)).not.toMatch(/ago/);
  });
});
