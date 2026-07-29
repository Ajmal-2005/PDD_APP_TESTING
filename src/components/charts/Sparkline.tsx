import { cx } from '@/lib/utils';

/** 12-ish point trend line. No axes, no labels — it rides beside a stat value. */
export function Sparkline({ values, color = 'rgb(var(--brand))', className }: {
  values: number[]; color?: string; className?: string;
}) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const x = (i: number) => (i / (values.length - 1)) * 100;
  const y = (v: number) => 26 - ((v - min) / span) * 22;
  const pts = values.map((v, i) => `${x(i)},${y(v)}`).join(' ');

  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={cx('overflow-visible', className)} aria-hidden>
      <polyline points={`0,30 ${pts} 100,30`} fill={color} opacity={0.1} stroke="none" />
      <polyline
        points={pts} fill="none" stroke={color} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
