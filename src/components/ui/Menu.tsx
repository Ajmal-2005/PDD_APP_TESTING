'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cx } from '@/lib/utils';

/** Closes on outside pointerdown and on Escape. Used by every popover in the shell. */
export function useDismiss<T extends HTMLElement>(open: boolean, close: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);
  return ref;
}

export function Menu({ trigger, children, align = 'end', width = 'w-56', label }: {
  trigger: (p: { open: boolean; toggle: () => void }) => ReactNode;
  children: (p: { close: () => void }) => ReactNode;
  align?: 'start' | 'end';
  width?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss<HTMLDivElement>(open, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      {open && (
        <div
          role="menu"
          aria-label={label}
          className={cx(
            'absolute z-50 mt-2 origin-top animate-pop overflow-hidden rounded-xl border border-line bg-panel p-1 shadow-lg',
            width,
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {children({ close: () => setOpen(false) })}
        </div>
      )}
    </div>
  );
}

export function MenuItem({ icon, children, onClick, href, danger, active, trailing, onMouseEnter }: {
  icon?: ReactNode; children: ReactNode; onClick?: () => void; href?: string;
  danger?: boolean; active?: boolean; trailing?: ReactNode; onMouseEnter?: () => void;
}) {
  const cls = cx(
    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px] transition',
    danger ? 'text-risk-high hover:bg-risk-high/10' : 'text-ink-2 hover:bg-panel-2 hover:text-ink',
    active && 'bg-panel-2 text-ink',
  );
  const inner = (
    <>
      {icon && <span className="shrink-0 text-ink-3">{icon}</span>}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {trailing}
    </>
  );
  if (href) return <a href={href} onMouseEnter={onMouseEnter} className={cls} role="menuitem">{inner}</a>;
  return <button type="button" role="menuitem" onMouseEnter={onMouseEnter} onClick={onClick} className={cls}>{inner}</button>;
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <p className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-ink-3">{children}</p>;
}

export function MenuSeparator() {
  return <div className="my-1 h-px bg-line" />;
}
