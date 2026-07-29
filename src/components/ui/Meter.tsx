'use client';

import type { ReactNode } from 'react';
import { cx } from '@/lib/utils';

/**
 * Severity meter. Per the viz method the unfilled track is a lighter step of the
 * fill's own hue, so the state reads across the whole bar rather than only the fill.
 */
export function Meter({ value, max = 100, color = 'rgb(var(--brand))', label, valueLabel, className, height = 8 }: {
  value: number; max?: number; color?: string; label?: ReactNode; valueLabel?: ReactNode;
  className?: string; height?: number;
}) {
  const pct = Math.max(0, Math.min(1, value / max)) * 100;
  return (
    <div className={className}>
      {(label || valueLabel) && (
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          {label && <span className="text-[12.5px] text-ink-2">{label}</span>}
          {valueLabel && <span className="text-[13px] font-semibold tnum text-ink">{valueLabel}</span>}
        </div>
      )}
      <div
        role="meter"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={max}
        className="w-full overflow-hidden rounded-full"
        style={{ height, background: `color-mix(in srgb, ${color} 16%, transparent)` }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-swift"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

/** Radial gauge for a single bounded ratio (confidence, farm health). */
export function RadialGauge({ value, size = 132, stroke = 10, color = 'rgb(var(--brand))', children, className }: {
  value: number; size?: number; stroke?: number; color?: string; children?: ReactNode; className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className={cx('relative inline-grid place-items-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke}
          style={{ stroke: `color-mix(in srgb, ${color} 16%, transparent)` }}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
          stroke={color} strokeDasharray={c} strokeDashoffset={c * (1 - v)}
          style={{ transition: 'stroke-dashoffset 800ms cubic-bezier(.32,.72,0,1)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}
