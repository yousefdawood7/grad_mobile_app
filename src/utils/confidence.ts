/**
 * Normalize a confidence value for display.
 *
 * Some backends store confidence as a decimal ratio (0–1) while others
 * use a percentage (0–100). This function normalises both to 0–100.
 */
export function displayConfidence(raw: number): number {
  if (typeof raw !== 'number' || isNaN(raw)) return 0;
  // If value is between 0 and 1 (exclusive of 0), treat as decimal ratio
  const pct = raw > 0 && raw <= 1 ? Math.round(raw * 100) : Math.round(raw);
  return Math.max(0, Math.min(100, pct));
}
