'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, ArrowRight, CloudSun, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui';
import { useApp } from '@/providers/AppProvider';
import { cx } from '@/lib/utils';
import type { StringKey } from '@/lib/i18n';

const PAGES: { icon: typeof ScanLine; title: StringKey; body: StringKey }[] = [
  { icon: ScanLine, title: 'onboard1Title', body: 'onboard1Body' },
  { icon: Activity, title: 'onboard2Title', body: 'onboard2Body' },
  { icon: CloudSun, title: 'onboard3Title', body: 'onboard3Body' },
];

export default function OnboardingScreen() {
  const [page, setPage] = useState(0);
  const router = useRouter();
  const { t } = useApp();
  const last = page === PAGES.length - 1;
  const { icon: Icon, title, body } = PAGES[page];

  const finish = () => {
    localStorage.setItem('agrovision.onboarded', '1');
    router.replace('/login');
  };

  return (
    <main className="flex min-h-screen flex-col px-5 py-10">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <button onClick={finish} className="ml-auto text-[13px] font-medium text-ink-3 transition hover:text-ink">
          {t('skipAction')}
        </button>

        <div key={page} className="flex flex-1 animate-fade-in flex-col items-center justify-center gap-6 text-center">
          <div className="grid h-20 w-20 place-items-center rounded-3xl bg-brand/10 text-brand">
            <Icon size={34} strokeWidth={1.6} />
          </div>
          <h2 className="text-title text-ink">{t(title)}</h2>
          <p className="max-w-sm text-[14px] leading-relaxed text-ink-2">{t(body)}</p>
        </div>

        <div className="mb-8 flex justify-center gap-2">
          {PAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              aria-label={`Page ${i + 1}`}
              className={cx('h-2 rounded-full transition-all', i === page ? 'w-7 bg-brand' : 'w-2 bg-line-strong')}
            />
          ))}
        </div>

        <Button variant="primary" size="lg" full icon={<ArrowRight size={16} />}
          onClick={() => (last ? finish() : setPage(page + 1))}>
          {last ? t('createAccount') : t('nextAction')}
        </Button>
      </div>
    </main>
  );
}
