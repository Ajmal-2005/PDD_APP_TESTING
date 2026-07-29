'use client';

import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { cx } from '@/lib/utils';

/**
 * A real data table, not a list of cards. Wide content scrolls inside its own
 * container so the page body never scrolls sideways.
 */
export function DataTable({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('w-full overflow-x-auto scroll-thin', className)}>
      <table className="w-full min-w-[42rem] border-collapse text-left text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className, sort, onSort, align = 'left', width }: {
  children?: ReactNode; className?: string;
  sort?: 'asc' | 'desc' | false; onSort?: () => void;
  align?: 'left' | 'right' | 'center'; width?: string;
}) {
  const Icon = sort === 'asc' ? ChevronUp : sort === 'desc' ? ChevronDown : ChevronsUpDown;
  return (
    <th
      scope="col"
      style={{ width }}
      aria-sort={sort === 'asc' ? 'ascending' : sort === 'desc' ? 'descending' : undefined}
      className={cx(
        'sticky top-0 z-10 whitespace-nowrap border-b border-line bg-panel-2/90 px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wider text-ink-3 backdrop-blur',
        align === 'right' && 'text-right', align === 'center' && 'text-center',
        className,
      )}
    >
      {onSort ? (
        <button
          onClick={onSort}
          className={cx('inline-flex items-center gap-1 transition hover:text-ink', align === 'right' && 'flex-row-reverse')}
        >
          {children}
          <Icon size={13} className={sort ? 'text-brand' : 'text-ink-3/60'} />
        </button>
      ) : children}
    </th>
  );
}

export function Td({ children, className, align = 'left' }: {
  children?: ReactNode; className?: string; align?: 'left' | 'right' | 'center';
}) {
  return (
    <td className={cx(
      'border-b border-line px-4 py-2.5 align-middle text-ink-2',
      align === 'right' && 'text-right tnum', align === 'center' && 'text-center',
      className,
    )}>
      {children}
    </td>
  );
}

export function Tr({ children, onClick, className }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <tr
      onClick={onClick}
      className={cx('group transition', onClick && 'cursor-pointer hover:bg-panel-2/70', className)}
    >
      {children}
    </tr>
  );
}
