'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { cx } from '@/lib/utils';

export function FieldRow({ label, hint, htmlFor, children, className }: {
  label: string; hint?: string; htmlFor?: string; children: ReactNode; className?: string;
}) {
  return (
    <div className={cx('grid gap-1.5', className)}>
      <label htmlFor={htmlFor} className="label">{label}</label>
      {children}
      {hint && <p className="text-[12px] leading-snug text-ink-3">{hint}</p>}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> { icon?: ReactNode; trailing?: ReactNode }

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { icon, trailing, className, ...rest }, ref,
) {
  if (!icon && !trailing) return <input ref={ref} className={cx('field', className)} {...rest} />;
  return (
    <div className="relative">
      {icon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3">{icon}</span>}
      <input ref={ref} className={cx('field', icon ? 'pl-9' : '', trailing ? 'pr-9' : '', className)} {...rest} />
      {trailing && <span className="absolute right-2.5 top-1/2 -translate-y-1/2">{trailing}</span>}
    </div>
  );
});

export function SearchInput(props: InputProps) {
  return <Input icon={<Search size={15} />} type="search" {...props} />;
}

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <div className="relative">
        <select ref={ref} className={cx('field cursor-pointer appearance-none pr-8', className)} {...rest}>
          {children}
        </select>
        <ChevronDown size={15} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
      </div>
    );
  },
);
