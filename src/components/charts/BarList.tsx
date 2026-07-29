'use client';

import { cx } from '@/lib/utils';

export interface BarDatum { label: string; value: number; color?: string; hint?: string }

/**
 * Horizontal bar list — the right form for ranked magnitude with long category
 * names, which a column chart would have to angle or truncate.
 * Value rides at the tip of each bar (direct label), so no x-axis is needed.
 */
export function BarList({ data, valueSuffix = '', className, barColor = 'rgb(var(--series-1))', onSelect }: {
  data: BarDatum[]; valueSuffix?: string; className?: string; barColor?: string;
  onSelect?: (d: BarDatum) => void;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <ul className={cx('space-y-2.5', className)}>
      {data.map((d) => {
        const pct = (d.value / max) * 100;
        const Row = onSelect ? 'button' : 'div';
        return (
          <li key={d.label}>
            <Row
              {...(onSelect ? { onClick: () => onSelect(d), type: 'button' as const } : {})}
              className={cx('w-full text-left', onSelect && 'group rounded-md transition')}
            >
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span className={cx('truncate text-[13px] text-ink-2', onSelect && 'group-hover:text-ink')}>
                  {d.label}
                </span>
                <span className="shrink-0 text-[13px] font-semibold tnum text-ink">
                  {d.value}{valueSuffix}
                </span>
              </div>
              {/* track is a light step of the fill's own hue */}
              <div
                className="h-2 w-full overflow-hidden rounded-full"
                style={{ background: `color-mix(in srgb, ${d.color ?? barColor} 14%, transparent)` }}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-700 ease-swift"
                  style={{ width: `${pct}%`, background: d.color ?? barColor }}
                />
              </div>
              {d.hint && <p className="mt-1 text-[11.5px] text-ink-3">{d.hint}</p>}
            </Row>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Vertical columns for time-ordered counts. Caps mark thickness at 24px and
 * leaves the band's remainder as air rather than filling it.
 */
export function ColumnChart({ data, height = 150, color = 'rgb(var(--series-1))', valueSuffix = '' }: {
  data: { label: string; value: number; title?: string }[]; height?: number; color?: string; valueSuffix?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="w-full">
      <div className="flex items-end justify-between gap-1.5" style={{ height }}>
        {data.map((d) => (
          <div key={d.label} className="group relative flex h-full min-w-0 flex-1 flex-col justify-end">
            <div
              className="mx-auto w-full max-w-[24px] rounded-t transition-[height] duration-500 ease-swift"
              style={{
                height: `${Math.max(2, (d.value / max) * 100)}%`,
                background: d.value === 0 ? 'rgb(var(--panel-3))' : color,
              }}
            />
            <span className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-line bg-panel px-2 py-1 text-[11.5px] font-medium text-ink opacity-0 shadow-md transition group-hover:opacity-100">
              {d.title ?? d.label}: <span className="tnum">{d.value}{valueSuffix}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between gap-1.5 text-[11px] text-ink-3">
        {data.map((d, i) => (
          <span key={d.label} className="min-w-0 flex-1 truncate text-center">
            {i % Math.ceil(data.length / 7) === 0 ? d.label : ''}
          </span>
        ))}
      </div>
    </div>
  );
}
