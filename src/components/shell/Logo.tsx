import { cx } from '@/lib/utils';

export function Logo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cx('grid shrink-0 place-items-center rounded-lg bg-brand text-brand-ink', className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 17c0-6.5 4.5-10.5 13-11 .5 7.5-4 12-11 12H6z" />
        <path d="M5.5 19c2-4.5 4.8-7.2 9-9" />
      </svg>
    </span>
  );
}

export function Wordmark({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 overflow-hidden">
      <Logo />
      {!collapsed && (
        <div className="min-w-0 leading-none">
          <p className="truncate text-[14.5px] font-semibold tracking-[-0.015em] text-ink">AgroVision</p>
          <p className="mt-0.5 truncate text-[9.5px] font-semibold uppercase tracking-[0.10em] text-brand">Smart Fields Better Yields</p>
        </div>
      )}
    </div>
  );
}
