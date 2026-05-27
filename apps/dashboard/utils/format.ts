// Prices are stored as integer cents in the DB (e.g. 1299 = $12.99).
// Always pass raw cents here; never divide by 100 in component files.
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// Returns a short relative string like "2h ago" or "Jan 3" if older than a day.
export function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 24) return `${hours}h ago`;
  return new Date(isoString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Zero-pads a number: formatOrderNumber(7) → "#007"
export function formatOrderNumber(n: number): string {
  return `#${String(n).padStart(3, "0")}`;
}
