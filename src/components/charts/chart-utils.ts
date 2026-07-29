/** Shared helpers for the hand-rolled SVG charts. */

export const SERIES_VARS = [
  'rgb(var(--series-1))',
  'rgb(var(--series-2))',
  'rgb(var(--series-3))',
  'rgb(var(--series-4))',
  'rgb(var(--series-5))',
] as const;

/**
 * Categorical hues are assigned in fixed order and never cycled. Past five
 * entities the caller must fold the tail into "Other" rather than reuse a hue.
 */
export const seriesColor = (i: number) => SERIES_VARS[i] ?? 'rgb(var(--ink-3))';

/** Sequential green ramp, near-surface -> full. Index 0 means "nothing here". */
export const HEAT_STEPS = [
  'rgb(var(--heat-0))',
  'rgb(var(--heat-1))',
  'rgb(var(--heat-2))',
  'rgb(var(--heat-3))',
  'rgb(var(--heat-4))',
];

/** Round an axis maximum up to a clean number so ticks read 0 / 5 / 10. */
export function niceMax(raw: number, ticks = 4): number {
  if (raw <= 0) return ticks;
  const rough = raw / ticks;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  return step * ticks;
}

export function axisTicks(max: number, count = 4): number[] {
  return Array.from({ length: count + 1 }, (_, i) => (max / count) * i);
}

/** 1,284 / 12.9K / 4.2M - compact figures for stat tiles and axis ticks. */
export function compact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 10_000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

export const shortDate = (ts: number, locale: string) =>
  new Date(ts).toLocaleDateString(locale === 'ta' ? 'ta-IN' : 'en-IN', { day: 'numeric', month: 'short' });
