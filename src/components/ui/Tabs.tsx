'use client';

import type { ReactNode } from 'react';
import { cx } from '@/lib/utils';

export interface TabItem<T extends string> { value: T; label: string; icon?: ReactNode; count?: number }

/** Underlined tabs - the desktop convention for switching a panel's content. */
export function Tabs<T extends string>({ items, value, onChange, className }: {
  items: TabItem<T>[]; value: T; onChange: (v: T) => void; className?: string;
}) {
  return (
    <div role="tablist" className={cx('flex items-center gap-1 overflow-x-auto border-b border-line', className)}>
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.value)}
            className={cx(
              'relative -mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-[13.5px] font-medium transition',
              active
                ? 'border-brand text-ink'
                : 'border-transparent text-ink-3 hover:border-line-strong hover:text-ink-2',
            )}
          >
            {it.icon}
            {it.label}
            {it.count !== undefined && (
              <span className={cx('rounded px-1.5 py-px text-[11px] tnum', active ? 'bg-brand/12 text-brand' : 'bg-panel-2 text-ink-3')}>
                {it.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Compact segmented control, for switching a chart's range or mode in place. */
export function SegmentedControl<T extends string>({ items, value, onChange, className }: {
  items: { value: T; label: string }[]; value: T; onChange: (v: T) => void; className?: string;
}) {
  return (
    <div className={cx('inline-flex items-center gap-0.5 rounded-lg border border-line bg-panel-2 p-0.5', className)}>
      {items.map((it) => (
        <button
          key={it.value}
          onClick={() => onChange(it.value)}
          aria-pressed={it.value === value}
          className={cx(
            'rounded-[6px] px-2.5 py-1 text-[12.5px] font-medium transition',
            it.value === value ? 'bg-panel text-ink shadow-sm' : 'text-ink-3 hover:text-ink',
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
