'use client';

import { ShieldCheck, TriangleAlert, AlertOctagon, Info, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cx } from '@/lib/utils';
import { useApp } from '@/providers/AppProvider';
import type { StringKey } from '@/lib/i18n';

export function Badge({ children, tone = 'neutral', className, icon }: {
  children: ReactNode;
  tone?: 'neutral' | 'brand' | 'high' | 'medium' | 'low' | 'safe';
  className?: string;
  icon?: ReactNode;
}) {
  const tones: Record<string, string> = {
    neutral: 'border-line bg-panel-2 text-ink-2',
    brand: 'border-brand/25 bg-brand/10 text-brand',
    high: 'border-risk-high/30 bg-risk-high/10 text-risk-high',
    medium: 'border-risk-medium/30 bg-risk-medium/10 text-risk-medium',
    low: 'border-risk-low/30 bg-risk-low/10 text-risk-low',
    safe: 'border-risk-safe/30 bg-risk-safe/10 text-risk-safe',
  };
  return (
    <span className={cx(
      'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-[11.5px] font-semibold tracking-wide',
      tones[tone], className,
    )}>
      {icon}
      {children}
    </span>
  );
}

/**
 * Risk is a status scale, so it never travels as colour alone: every badge
 * carries an icon and the level's own translated word.
 */
const RISK: Record<string, { tone: 'high' | 'medium' | 'low' | 'safe' | 'neutral'; icon: LucideIcon; key: StringKey }> = {
  HIGH: { tone: 'high', icon: AlertOctagon, key: 'riskHigh' },
  MEDIUM: { tone: 'medium', icon: TriangleAlert, key: 'riskMedium' },
  LOW: { tone: 'low', icon: Info, key: 'riskLow' },
  SAFE: { tone: 'safe', icon: ShieldCheck, key: 'riskSafe' },
  UNKNOWN: { tone: 'neutral', icon: Info, key: 'diseaseUnknown' },
};

export function RiskBadge({ level, size = 'md' }: { level: string; size?: 'sm' | 'md' }) {
  const { t } = useApp();
  const r = RISK[level] ?? RISK.UNKNOWN;
  const Icon = r.icon;
  return (
    <Badge tone={r.tone} icon={<Icon size={size === 'sm' ? 11 : 12.5} />} className={size === 'sm' ? 'px-1.5 text-[11px]' : undefined}>
      {t(r.key)}
    </Badge>
  );
}

export const riskVar = (level: string) =>
  ({ HIGH: 'var(--risk-high)', MEDIUM: 'var(--risk-medium)', LOW: 'var(--risk-low)', SAFE: 'var(--risk-safe)' }[level] ?? 'var(--ink-3)');

/** `rgb(...)` string for inline SVG fills, which cannot use the bare triplet. */
export const riskColor = (level: string) => `rgb(${riskVar(level)})`;
