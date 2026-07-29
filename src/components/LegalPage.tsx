'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/shell/Logo';
import { useApp } from '@/providers/AppProvider';

export interface Section { heading: string; body: string }

/** Public reading layout for privacy / terms - a centered document column with a
 *  slim branded header, no app chrome (these are reachable before sign-in). */
export function LegalPage({ title, sections, footer }: { title: string; sections: Section[]; footer?: string }) {
  const { t } = useApp();
  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-20 border-b border-line bg-panel/85 backdrop-blur-xl">
        <div className="mx-auto flex h-topbar max-w-3xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={26} />
            <span className="text-[14.5px] font-semibold text-ink">AgroVision AI</span>
          </Link>
          <Link href="/login" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-2 transition hover:text-ink">
            <ArrowLeft size={15} />{t('loginButton')}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10 lg:py-14">
        <h1 className="text-display text-ink">{title}</h1>
        {footer && <p className="mt-2 text-[13px] text-ink-3">{footer}</p>}

        <div className="mt-8 space-y-8">
          {sections.map((s, i) => (
            <section key={s.heading}>
              <h2 className="flex items-baseline gap-2 text-heading text-ink">
                <span className="text-[13px] font-semibold text-brand tnum">{String(i + 1).padStart(2, '0')}</span>
                {s.heading}
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{s.body}</p>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
