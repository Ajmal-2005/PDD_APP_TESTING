'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, Check, Languages } from 'lucide-react';
import { Button } from '@/components/ui';
import { useApp } from '@/providers/AppProvider';
import { LOCALES, LOCALE_NAMES, type Locale } from '@/lib/i18n';
import { cx } from '@/lib/utils';

export default function LanguageSelectionScreen() {
  const { locale, setLocale, t } = useApp();
  const router = useRouter();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand">
            <Languages size={26} />
          </div>
          <h1 className="text-title text-ink">{t('language')}</h1>
          <p className="mt-1.5 text-[13.5px] text-ink-2">{t('chooseLanguage')}</p>
        </div>

        <div className="space-y-3">
          {LOCALES.map((l: Locale) => (
            <button
              key={l}
              onClick={() => setLocale(l)}
              className={cx(
                'flex w-full items-center justify-between rounded-xl border px-5 py-4 text-left transition',
                locale === l ? 'border-brand bg-brand/8 shadow-sm' : 'border-line bg-panel hover:border-line-strong hover:bg-panel-2',
              )}
            >
              <span className="text-[15px] font-medium text-ink">{LOCALE_NAMES[l]}</span>
              {locale === l && <Check size={19} className="text-brand" />}
            </button>
          ))}
        </div>

        <Button variant="primary" size="lg" full className="mt-8" icon={<ArrowRight size={16} />}
          onClick={() => router.push('/onboarding')}>
          {t('continueAction')}
        </Button>
      </div>
    </main>
  );
}
