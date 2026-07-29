'use client';

import { cx } from '@/lib/utils';

export function Toggle({ checked, onChange, label, id }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; id?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative h-6 w-11 shrink-0 rounded-full transition',
        checked ? 'bg-brand' : 'bg-line-strong',
      )}
    >
      <span
        className={cx(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200 ease-swift',
          checked ? 'left-[22px]' : 'left-0.5',
        )}
      />
    </button>
  );
}
