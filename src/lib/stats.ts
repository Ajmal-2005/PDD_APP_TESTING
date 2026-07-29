import type { Scan } from './db';

export type RangeKey = '7' | '30' | '90' | 'all';

export const RANGE_DAYS: Record<RangeKey, number> = { '7': 7, '30': 30, '90': 90, all: Number.MAX_SAFE_INTEGER };

const DAY = 86_400_000;

export function inRange(scans: Scan[], range: RangeKey, now = Date.now()): Scan[] {
  if (range === 'all') return scans;
  const from = now - RANGE_DAYS[range] * DAY;
  return scans.filter((s) => s.timestamp >= from);
}

/** The window immediately before the current one, for period-over-period deltas. */
export function previousWindow(scans: Scan[], range: RangeKey, now = Date.now()): Scan[] {
  if (range === 'all') return [];
  const span = RANGE_DAYS[range] * DAY;
  return scans.filter((s) => s.timestamp >= now - span * 2 && s.timestamp < now - span);
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export interface Stats {
  total: number;
  healthy: number;
  diseased: number;
  healthRatio: number;
  highRisk: number;
  avgDri: number;
  avgConfidence: number;
  /** Counts per diagnosis, most frequent first. */
  byDisease: { label: string; value: number }[];
  /** Counts per risk level, fixed order. */
  byRisk: { level: string; value: number }[];
  /** DRI per scan, oldest first — the trend series. */
  driSeries: { label: string; value: number; ts: number }[];
  /** Scans per calendar day across the window, oldest first. */
  perDay: { label: string; value: number; ts: number }[];
}

export function computeStats(scans: Scan[], locale = 'en'): Stats {
  const healthy = scans.filter((s) => s.disease === 'Healthy').length;

  const diseaseCounts = new Map<string, number>();
  for (const s of scans) diseaseCounts.set(s.disease, (diseaseCounts.get(s.disease) ?? 0) + 1);

  const riskOrder = ['HIGH', 'MEDIUM', 'LOW', 'SAFE'];
  const riskCounts = new Map<string, number>();
  for (const s of scans) riskCounts.set(s.riskLevel, (riskCounts.get(s.riskLevel) ?? 0) + 1);

  const fmt = (ts: number) =>
    new Date(ts).toLocaleDateString(locale === 'ta' ? 'ta-IN' : 'en-IN', { day: 'numeric', month: 'short' });

  const chronological = [...scans].sort((a, b) => a.timestamp - b.timestamp);

  // Bucket by calendar day, filling gaps so the volume chart shows real quiet days.
  const perDay: { label: string; value: number; ts: number }[] = [];
  if (chronological.length) {
    const counts = new Map<string, number>();
    for (const s of chronological) {
      const k = new Date(s.timestamp).toDateString();
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    const start = new Date(chronological[0].timestamp);
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    // Cap the axis so a year-old first scan doesn't render 365 columns.
    const maxDays = 60;
    const span = Math.min(maxDays, Math.round((end.getTime() - start.getTime()) / DAY) + 1);
    for (let i = span - 1; i >= 0; i--) {
      const d = new Date(end.getTime() - i * DAY);
      perDay.push({ label: fmt(d.getTime()), value: counts.get(d.toDateString()) ?? 0, ts: d.getTime() });
    }
  }

  return {
    total: scans.length,
    healthy,
    diseased: scans.length - healthy,
    healthRatio: scans.length ? healthy / scans.length : 0,
    highRisk: scans.filter((s) => s.riskLevel === 'HIGH').length,
    avgDri: mean(scans.map((s) => s.driScore)),
    avgConfidence: mean(scans.map((s) => s.confidence)),
    byDisease: [...diseaseCounts.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value),
    byRisk: riskOrder.map((level) => ({ level, value: riskCounts.get(level) ?? 0 })),
    driSeries: chronological.map((s) => ({ label: fmt(s.timestamp), value: s.driScore, ts: s.timestamp })),
    perDay,
  };
}

/**
 * Signed change between two windows. Returns undefined when the previous window
 * has no data — showing "+100%" against zero history would be meaningless.
 */
export function delta(current: number, prev: number, prevCount: number): number | undefined {
  if (prevCount === 0) return undefined;
  return current - prev;
}

/** Fold everything past `keep` into a single "Other" slice; hues are never cycled. */
export function foldTail<T extends { label: string; value: number }>(items: T[], keep: number, otherLabel: string) {
  if (items.length <= keep) return items.map((i) => ({ label: i.label, value: i.value }));
  const head = items.slice(0, keep).map((i) => ({ label: i.label, value: i.value }));
  const rest = items.slice(keep).reduce((n, i) => n + i.value, 0);
  return rest > 0 ? [...head, { label: otherLabel, value: rest }] : head;
}
