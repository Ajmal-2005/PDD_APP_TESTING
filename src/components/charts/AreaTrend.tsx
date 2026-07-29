'use client';

import { useMemo, useState } from 'react';
import { axisTicks, niceMax, seriesColor } from './chart-utils';
import { useMeasure } from './useMeasure';
import { cx } from '@/lib/utils';

export interface TrendPoint { label: string; values: number[] }

const PAD = { t: 12, r: 14, b: 26, l: 36 };

/**
 * Multi-series line/area chart with a crosshair tooltip.
 *
 * Hover resolves to the nearest x-index over the whole plot column rather than
 * hit-testing the 2px stroke, so the target is comfortably large.
 */
export function AreaTrend({
  data, seriesNames, height = 220, valueSuffix = '', decimals = 1, className, area = true,
}: {
  data: TrendPoint[];
  seriesNames: string[];
  height?: number;
  valueSuffix?: string;
  decimals?: number;
  className?: string;
  area?: boolean;
}) {
  const [ref, width] = useMeasure<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const max = useMemo(
    () => niceMax(Math.max(...data.flatMap((d) => d.values), 1)),
    [data],
  );

  if (data.length < 2) return null;

  const ticks = axisTicks(max);
  const plotW = Math.max(0, width - PAD.l - PAD.r);
  const plotH = height - PAD.t - PAD.b;
  const x = (i: number) => PAD.l + (i / (data.length - 1)) * plotW;
  const y = (v: number) => PAD.t + plotH * (1 - v / max);

  const paths = seriesNames.map((_, s) => {
    const pts = data.map((d, i) => `${x(i)},${y(d.values[s] ?? 0)}`);
    return { line: `M${pts.join('L')}`, fill: `M${x(0)},${y(0)}L${pts.join('L')}L${x(data.length - 1)},${y(0)}Z` };
  });

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    const frac = (e.clientX - box.left - PAD.l) / (plotW || 1);
    setHover(Math.max(0, Math.min(data.length - 1, Math.round(frac * (data.length - 1)))));
  }

  // Thin out x labels so they never collide at narrow widths.
  const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(plotW / 68))));
  const active = hover !== null ? data[hover] : null;

  return (
    <div ref={ref} className={cx('relative w-full', className)}>
      {seriesNames.length > 1 && (
        <div className="mb-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {seriesNames.map((n, i) => (
            <span key={n} className="inline-flex items-center gap-1.5 text-[12px] text-ink-2">
              <span className="h-0.5 w-3.5 rounded-full" style={{ background: seriesColor(i) }} />
              {n}
            </span>
          ))}
        </div>
      )}

      {width > 0 && (
        <svg
          width={width}
          height={height}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
          role="img"
          aria-label={`Trend: ${seriesNames.join(', ')}`}
          className="block touch-none"
        >
          {ticks.map((tv) => (
            <g key={tv}>
              <line x1={PAD.l} x2={width - PAD.r} y1={y(tv)} y2={y(tv)} stroke="rgb(var(--grid))" strokeWidth={1} />
              <text x={PAD.l - 6} y={y(tv)} textAnchor="end" dominantBaseline="middle" fontSize={10} className="fill-ink-3 tnum">
                {Number.isInteger(tv) ? tv : tv.toFixed(1)}
              </text>
            </g>
          ))}

          {area && paths.map((p, i) => <path key={`f${i}`} d={p.fill} fill={seriesColor(i)} opacity={0.1} />)}

          {hover !== null && (
            <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={PAD.t + plotH} stroke="rgb(var(--line-strong))" strokeWidth={1} />
          )}

          {paths.map((p, i) => (
            <path key={`l${i}`} d={p.line} fill="none" stroke={seriesColor(i)} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          ))}

          {/* markers >= 8px, 2px surface ring keeps them legible over the line */}
          {hover !== null && seriesNames.map((_, i) => (
            <circle
              key={`m${i}`} cx={x(hover)} cy={y(data[hover].values[i] ?? 0)} r={4.5}
              fill={seriesColor(i)} stroke="rgb(var(--panel))" strokeWidth={2}
            />
          ))}

          {data.map((d, i) =>
            i % labelEvery === 0 || i === data.length - 1 ? (
              <text key={d.label + i} x={x(i)} y={height - 7} textAnchor="middle" fontSize={10.5} className="fill-ink-3">
                {d.label}
              </text>
            ) : null,
          )}
        </svg>
      )}

      {active && (
        <div
          className="pointer-events-none absolute top-8 z-10 min-w-[9.5rem] rounded-lg border border-line bg-panel p-2.5 shadow-lg"
          style={{
            left: Math.max(0, Math.min(width - 160, x(hover!) - 78)),
          }}
        >
          <p className="mb-1.5 text-[11.5px] font-medium text-ink-3">{active.label}</p>
          {seriesNames.map((n, i) => (
            <p key={n} className="flex items-center justify-between gap-4 text-[12.5px]">
              <span className="inline-flex items-center gap-1.5 text-ink-2">
                <span className="h-2 w-2 rounded-full" style={{ background: seriesColor(i) }} />
                {n}
              </span>
              <span className="font-semibold tnum text-ink">
                {(active.values[i] ?? 0).toFixed(decimals)}{valueSuffix}
              </span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
