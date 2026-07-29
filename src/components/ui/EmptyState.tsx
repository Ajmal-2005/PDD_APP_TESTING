import type { ReactNode } from 'react';
import { cx } from '@/lib/utils';

export function EmptyState({ icon, title, hint, action, className, compact }: {
  icon?: ReactNode; title: string; hint?: string; action?: ReactNode; className?: string; compact?: boolean;
}) {
  return (
    <div className={cx('flex flex-col items-center justify-center px-6 text-center', compact ? 'py-10' : 'py-16', className)}>
      {icon && (
        <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl border border-line bg-panel-2 text-ink-3">
          {icon}
        </div>
      )}
      <p className="text-[15px] font-medium text-ink">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-ink-3">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
