'use client';

import { Leaf } from 'lucide-react';
import { Button } from '@/components/ui';
import { useApp } from '@/providers/AppProvider';

export default function NotFound() {
  const { t } = useApp();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-8 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl border border-line bg-panel-2 text-ink-3">
        <Leaf size={26} />
      </div>
      <p className="text-[13px] font-semibold uppercase tracking-wider text-ink-3">404</p>
      <h1 className="text-title text-ink">{t('notFoundTitle')}</h1>
      <p className="max-w-sm text-[13.5px] text-ink-2">{t('notFoundBody')}</p>
      <Button variant="primary" href="/dashboard" className="mt-2">{t('goHome')}</Button>
    </main>
  );
}
