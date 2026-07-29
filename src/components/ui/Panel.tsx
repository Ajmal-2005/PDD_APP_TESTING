'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { cx } from '@/lib/utils';

/**
 * The single surface primitive. Everything on a page is a Panel or lives in one -
 * that consistency is what keeps a dense dashboard from reading as clutter.
 */
export function Panel({ children, className, as: As = 'section' }: {
  children: ReactNode; className?: string; as?: 'section' | 'div' | 'article';
}) {
  return <As className={cx('panel', className)}>{children}</As>;
}

export function PanelHeader({ title, subtitle, action, icon, className }: {
  title: ReactNode; subtitle?: ReactNode; action?: ReactNode; icon?: ReactNode; className?: string;
}) {
  return (
    <div className={cx('flex items-start justify-between gap-4 border-b border-line px-5 py-3.5', className)}>
      <div className="flex min-w-0 items-start gap-2.5">
        {icon && <span className="mt-0.5 shrink-0 text-ink-3">{icon}</span>}
        <div className="min-w-0">
          <h2 className="truncate text-heading text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[13px] leading-snug text-ink-3">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function PanelBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('p-5', className)}>{children}</div>;
}

export function PanelLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded-md text-[13px] font-medium text-ink-2 transition hover:text-brand"
    >
      {children}
      <ArrowUpRight size={14} />
    </Link>
  );
}
