'use client';

import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { ReactNode } from 'react';
import { cx } from '@/lib/utils';
import { Sparkline } from '@/components/charts/Sparkline';

/**
 * Stat tile contract from the viz method: label (sentence case) / value
 * (proportional figures, never tabular at display size) / optional delta
 * against a named period / optional sparkline.
 */
export function StatTile({ label, value, unit, delta, deltaLabel, deltaGoodWhen = 'up', trend, icon, href, className }: {
  label: string;
  value: string | number;
  unit?: string;
  delta?: number;
  deltaLabel?: string;
  deltaGoodWhen?: 'up' | 'down';
  trend?: number[];
  icon?: ReactNode;
  href?: string;
  className?: string;
}) {
  const hasDelta = delta !== undefined && Number.isFinite(delta);
  const flat = hasDelta && Math.abs(delta!) < 0.05;
  const up = hasDelta && delta! > 0;
  const good = flat ? null : deltaGoodWhen === 'up' ? up : !up;
  const DeltaIcon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-ink-2">{label}</p>
        {icon && <span className="shrink-0 text-ink-3">{icon}</span>}
      </div>

      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-[28px] font-semibold leading-none tracking-[-0.02em] text-ink">{value}</span>
        {unit && <span className="text-[13px] font-medium text-ink-3">{unit}</span>}
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        {hasDelta ? (
          <span className="inline-flex items-center gap-1 text-[12.5px] font-medium">
            <DeltaIcon
              size={13}
              className={good === null ? 'text-ink-3' : good ? 'text-risk-safe' : 'text-risk-high'}
            />
            <span className={good === null ? 'text-ink-3' : good ? 'text-risk-safe' : 'text-risk-high'}>
              {flat ? '0' : `${up ? '+' : ''}${delta!.toFixed(1)}`}
            </span>
            {deltaLabel && <span className="text-ink-3">{deltaLabel}</span>}
          </span>
        ) : <span />}
        {trend && trend.length > 1 && <Sparkline values={trend} className="h-7 w-20" />}
      </div>
    </>
  );

  const cls = cx('panel p-4 transition', href && 'hover:border-line-strong hover:shadow-md', className);
  return href ? <Link href={href} className={cx(cls, 'block')}>{body}</Link> : <div className={cls}>{body}</div>;
}
