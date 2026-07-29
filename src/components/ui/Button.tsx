'use client';

import Link from 'next/link';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cx } from '@/lib/utils';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-brand text-brand-ink shadow-sm hover:bg-brand-hover active:translate-y-px disabled:hover:bg-brand',
  secondary:
    'border border-line bg-panel text-ink hover:border-line-strong hover:bg-panel-2 active:translate-y-px',
  subtle: 'bg-panel-2 text-ink hover:bg-panel-3 active:translate-y-px',
  ghost: 'text-ink-2 hover:bg-panel-2 hover:text-ink active:translate-y-px',
  danger: 'bg-risk-high text-white shadow-sm hover:brightness-110 active:translate-y-px',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 gap-1.5 px-2.5 text-[13px]',
  md: 'h-9 gap-2 px-3.5 text-sm',
  lg: 'h-11 gap-2 px-5 text-[15px]',
  icon: 'h-9 w-9 justify-center',
};

const BASE =
  'inline-flex select-none items-center whitespace-nowrap rounded-lg font-medium transition ' +
  'disabled:pointer-events-none disabled:opacity-45';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  /** Renders an anchor styled as a button. */
  href?: string;
  full?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', loading, icon, href, full, className, children, disabled, ...rest },
  ref,
) {
  const cls = cx(BASE, VARIANTS[variant], SIZES[size], full && 'w-full justify-center', className);
  const inner = (
    <>
      {loading ? <Spinner size={size === 'lg' ? 17 : 15} /> : icon}
      {children}
    </>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button ref={ref} className={cls} disabled={disabled || loading} {...rest}>
      {inner}
    </button>
  );
});
