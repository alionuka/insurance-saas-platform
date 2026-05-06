/**
 * Deterministic date formatter that produces identical output on both the
 * Next.js server (Node.js) and the browser, avoiding React hydration mismatches
 * caused by locale-dependent methods like `toLocaleDateString()`.
 *
 * Output format: YYYY-MM-DD  (e.g. "2026-05-04")
 */
export function formatDate(value: string | number | Date | null | undefined): string {
  if (value == null) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Deterministic currency formatter that produces identical output on both the
 * Next.js server (Node.js) and the browser, avoiding React hydration mismatches
 * caused by locale-dependent methods like `toLocaleString()` or `Intl.NumberFormat`.
 *
 * Uses manual comma insertion so the result is always the same regardless of
 * the OS/Node locale (e.g. en-US uses "," but some locales use " " or ".").
 *
 * Output format: $1,234.56
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '—';
  const fixed = value.toFixed(2);                  // always "1234.56"
  const [intPart, decPart] = fixed.split('.');
  // Insert commas every three digits from the right
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `$${withCommas}.${decPart}`;
}
