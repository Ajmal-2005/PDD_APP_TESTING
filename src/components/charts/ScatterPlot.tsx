'use client';

import { useState } from 'react';
import { axisTicks, niceMax } from './chart-utils';
import { useMeasure } from './useMeasure';

export interface ScatterPoint { x: number; y: number; label: string; color?: string }

const PAD = { t: 12, r: 14, b: 30, l: 38 };

/**
 * Scatter of two measures per scan (e.g. humidity vs risk). Each dot carries a
 * 2px surface ring so overlapping points stay legible; hover reveals the pair.
 */
export function ScatterPlot({ points, xLabel, yLabel, xSuffix = '', ySuffix = '', xMax: xMaxHint, yMax: yMaxHint, height = 240 }: {
  points: ScatterPoint[];
  xLabel: string; yLabel: string; xSuffix?: string; ySuffix?: string;
  xMax?: number; yMax?: number; height?: number;
}) {
  const [ref, width] = useMeasure<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const xMax = niceMax(xMaxHint ?? Math.max(...points.map((p) => p.x), 1));
  const yMax = niceMax(yMaxHint ?? Math.max(...points.map((p) => p.y), 1));
  const plotW = Math.max(0, width - PAD.l - PAD.r);
  const plotH = height - PAD.t - PAD.b;
  const px = (v: number) => PAD.l + (v / xMax) * plotW;
  const py = (v: number) => PAD.t + plotH * (1 - v / yMax);

  return (
    <div ref={ref} className="relative w-full">
      {width > 0 && (
        <svg width={width} height={height} className="block" role="img" aria-label={`${yLabel} vs ${xLabel}`}>
          {axisTicks(yMax).map((tv) => (
            <g key={`y${tv}`}>
              <line x1={PAD.l} x2={width - PAD.r} y1={py(tv)} y2={py(tv)} stroke="rgb(var(--grid))" strokeWidth={1} />
              <text x={PAD.l - 6} y={py(tv)} textAnchor="end" dominantBaseline="middle" fontSize={10} className="fill-ink-3 tnum">
                {Number.isInteger(tv) ? tv : tv.toFixed(0)}
              </text>
            </g>
          ))}
          {axisTicks(xMax).map((tv) => (
            <text key={`x${tv}`} x={px(tv)} y={height - 12} textAnchor="middle" fontSize={10} className="fill-ink-3 tnum">
              {Number.isInteger(tv) ? tv : tv.toFixed(0)}{xSuffix}
            </text>
          ))}

          {/* axis titles */}
          <text x={PAD.l + plotW / 2} y={height} textAnchor="middle" fontSize={10.5} className="fill-ink-3">{xLabel}</text>

          {points.map((p, i) => (
            <circle
              key={i}
              cx={px(p.x)} cy={py(p.y)} r={hover === i ? 6 : 4.5}
              fill={p.color ?? 'rgb(var(--series-1))'}
              stroke="rgb(var(--panel))" strokeWidth={2}
              opacity={hover === null || hover === i ? 0.95 : 0.5}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className="cursor-default transition-[r]"
            />
          ))}
        </svg>
      )}

      {hover !== null && width > 0 && (
        <div
          className="pointer-events-none absolute z-10 min-w-[9rem] -translate-x-1/2 -translate-y-full rounded-lg border border-line bg-panel p-2.5 shadow-lg"
          style={{ left: Math.max(72, Math.min(width - 72, px(points[hover].x))), top: py(points[hover].y) - 8 }}
        >
          <p className="mb-1 truncate text-[12px] font-medium text-ink">{points[hover].label}</p>
          <p className="flex justify-between gap-4 text-[12px] text-ink-2">{xLabel}<span className="font-semibold tnum text-ink">{points[hover].x}{xSuffix}</span></p>
          <p className="flex justify-between gap-4 text-[12px] text-ink-2">{yLabel}<span className="font-semibold tnum text-ink">{points[hover].y.toFixed(1)}{ySuffix}</span></p>
        </div>
      )}
    </div>
  );
}
