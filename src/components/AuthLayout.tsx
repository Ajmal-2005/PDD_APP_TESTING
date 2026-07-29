'use client';

import Link from 'next/link';
import { Activity, CloudSun, ScanLine, ShieldCheck, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Logo } from '@/components/shell/Logo';
import { useApp } from '@/providers/AppProvider';
import type { StringKey } from '@/lib/i18n';

const FEATURES: { icon: LucideIcon; title: StringKey; body: StringKey }[] = [
  { icon: ScanLine, title: 'onboard1Title', body: 'onboard1Body' },
  { icon: Activity, title: 'onboard2Title', body: 'onboard2Body' },
  { icon: CloudSun, title: 'onboard3Title', body: 'onboard3Body' },
];

/**
 * Split-screen auth layout: a branded showcase panel on the left (desktop only)
 * and the form on the right. Deliberately not the phone's centered single column.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  const { t } = useApp();
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Showcase */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand to-brand-hover p-10 text-white lg:flex lg:flex-col xl:p-14">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-black/10 blur-3xl" />

        <Link href="/" className="relative flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 backdrop-blur">
            <Logo size={22} className="bg-transparent" />
          </span>
          <span className="text-[16px] font-semibold tracking-[-0.015em]">AgroVision</span>
        </Link>

        <div className="relative my-auto max-w-md">
          <h2 className="text-[30px] font-semibold leading-tight tracking-[-0.02em] xl:text-[34px]">
            {t('loginTitle')}
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-white/85">{t('scanInstruction')}</p>

          <ul className="mt-9 space-y-5">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15 backdrop-blur">
                  <Icon size={19} />
                </span>
                <div>
                  <p className="text-[14.5px] font-semibold">{t(title)}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-white/80">{t(body)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative flex items-center gap-2 text-[12.5px] text-white/70">
          <ShieldCheck size={15} />{t('offlineReady')}
        </p>
      </div>

      {/* Form */}
      <div className="flex flex-col justify-center px-5 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <Logo />
            <span className="text-[16px] font-semibold text-ink">AgroVision</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
