'use client';

import { useState } from 'react';
import { HEAT_STEPS } from './chart-utils';

export interface HeatCell { key: string; date: Date; count: number }

const level = (c: number) => (c === 0 ? 0 : c === 1 ? 1 : c <= 3 ? 2 : c <= 5 ? 3 : 4);

/**
 * Contribution-style activity grid. Sequential single-hue ramp: light means
 * "near zero", so magnitude reads without a legend lookup (one is shipped anyway).
 */
export function Heatmap({ cells, weekdayLabels, lessLabel, moreLabel, locale }: {
  cells: HeatCell[]; weekdayLabels: string[]; lessLabel: string; moreLabel: string; locale: string;
}) {
  const [hover, setHover] = useState<HeatCell | null>(null);

  return (
    <div>
      <div className="flex gap-1.5">
        <div className="grid grid-rows-7 gap-[3px] pr-1 text-[10px] leading-none text-ink-3">
          {weekdayLabels.map((d, i) => (
            <span key={d + i} className="flex h-3 items-center">{i % 2 === 1 ? d : ''}</span>
          ))}
        </div>

        <div className="min-w-0 flex-1 overflow-x-auto scroll-thin pb-1">
          <div className="grid grid-flow-col grid-rows-7 gap-[3px]">
            {cells.map((c) => (
              <button
                key={c.key}
                type="button"
                onMouseEnter={() => setHover(c)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(c)}
                onBlur={() => setHover(null)}
                aria-label={`${c.date.toLocaleDateString(locale)}: ${c.count}`}
                className="h-3 w-3 rounded-[3px] transition hover:ring-2 hover:ring-brand/40"
                style={{ background: HEAT_STEPS[level(c.count)] }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="h-4 text-[11.5px] text-ink-2">
          {hover && (
            <>
              <span className="font-semibold text-ink tnum">{hover.count}</span>
              {' · '}
              {hover.date.toLocaleDateString(locale === 'ta' ? 'ta-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </>
          )}
        </p>
        <div className="flex shrink-0 items-center gap-1.5 text-[11px] text-ink-3">
          {lessLabel}
          {HEAT_STEPS.map((s, i) => <span key={i} className="h-3 w-3 rounded-[3px]" style={{ background: s }} />)}
          {moreLabel}
        </div>
      </div>
    </div>
  );
}

export function buildHeatCells(timestamps: number[], days = 119): HeatCell[] {
  const counts = new Map<string, number>();
  for (const ts of timestamps) {
    const k = new Date(ts).toDateString();
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  // Start on a Sunday so each column is a clean calendar week.
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days);
  start.setDate(start.getDate() - start.getDay());

  const out: HeatCell[] = [];
  for (let d = new Date(start); d <= new Date(); d.setDate(d.getDate() + 1)) {
    const key = d.toDateString();
    out.push({ key, date: new Date(d), count: counts.get(key) ?? 0 });
  }
  return out;
}
