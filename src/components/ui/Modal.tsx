'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cx } from '@/lib/utils';
import { useDismiss } from './Menu';

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }: {
  open: boolean; onClose: () => void; title: string; description?: string;
  children: ReactNode; footer?: ReactNode; size?: 'md' | 'lg' | 'xl';
}) {
  const ref = useDismiss<HTMLDivElement>(open, onClose);

  // Freeze the page behind the dialog.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  const widths = { md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 py-[8vh]">
      <div className="fixed inset-0 animate-fade-in bg-black/50 backdrop-blur-[2px]" aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx('relative z-10 w-full animate-rise rounded-2xl border border-line bg-panel shadow-lg', widths[size])}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-heading text-ink">{title}</h2>
            {description && <p className="mt-0.5 text-[13px] text-ink-3">{description}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="-mr-1 rounded-lg p-1.5 text-ink-3 transition hover:bg-panel-2 hover:text-ink">
            <X size={17} />
          </button>
        </div>
        <div className="max-h-[62vh] overflow-y-auto scroll-thin p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line bg-panel-2/60 px-5 py-3.5">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
