'use client';

import { useState } from 'react';
import { cx } from '@/lib/utils';

export interface Slice { label: string; value: number; color: string }

/**
 * Donut for a part-to-whole split. Segments are separated by a 2px gap in the
 * surface colour rather than a stroke, and the legend always ships — hue alone
 * never carries identity.
 */
export function Donut({ slices, size = 168, thickness = 22, centerLabel, centerValue, className }: {
  slices: Slice[]; size?: number; thickness?: number;
  centerLabel?: string; centerValue?: string; className?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const total = slices.reduce((n, s) => n + s.value, 0);
  if (total <= 0) return null;

  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const GAP = 2; // px of surface between segments

  let offset = 0;
  const arcs = slices.map((s) => {
    const len = (s.value / total) * c;
    const arc = { ...s, len: Math.max(0, len - GAP), offset };
    offset += len;
    return arc;
  });

  return (
    <div className={cx('flex flex-wrap items-center gap-x-6 gap-y-4', className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" role="img" aria-label="Distribution">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--panel-3))" strokeWidth={thickness} />
          {arcs.map((a, i) => (
            <circle
              key={a.label}
              cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={a.color}
              strokeWidth={hover === i ? thickness + 4 : thickness}
              strokeDasharray={`${a.len} ${c - a.len}`}
              strokeDashoffset={-a.offset}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className="cursor-default transition-[stroke-width] duration-150"
            />
          ))}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-[26px] font-semibold leading-none tracking-[-0.02em] text-ink">
              {hover !== null ? slices[hover].value : centerValue ?? total}
            </p>
            <p className="mt-1 px-4 text-[11.5px] leading-tight text-ink-3">
              {hover !== null ? slices[hover].label : centerLabel}
            </p>
          </div>
        </div>
      </div>

      <ul className="min-w-[10rem] flex-1 space-y-1.5">
        {slices.map((s, i) => (
          <li
            key={s.label}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            className={cx('flex items-center justify-between gap-3 rounded-md px-1.5 py-1 text-[13px] transition',
              hover === i && 'bg-panel-2')}
          >
            <span className="flex min-w-0 items-center gap-2 text-ink-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: s.color }} />
              <span className="truncate">{s.label}</span>
            </span>
            <span className="shrink-0 tnum text-ink-3">
              <span className="font-semibold text-ink">{s.value}</span>
              {' '}({((s.value / total) * 100).toFixed(0)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
