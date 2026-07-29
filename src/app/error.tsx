'use client';

import { useEffect } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui';
import { useApp } from '@/providers/AppProvider';

export default function ErrorScreen({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useApp();

  useEffect(() => { console.error(error); }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-8 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl border border-risk-high/30 bg-risk-high/10 text-risk-high">
        <TriangleAlert size={26} />
      </div>
      <h1 className="text-title text-ink">{t('errorTitle')}</h1>
      <p className="max-w-sm text-[13.5px] text-ink-2">{t('errorBody')}</p>
      {error.message && (
        <p className="max-w-md break-words rounded-lg border border-line bg-panel-2 p-3 text-left font-mono text-[12px] text-ink-3">
          {error.message}
        </p>
      )}
      <div className="mt-2 flex gap-3">
        <Button variant="primary" onClick={reset}>{t('tryAgain')}</Button>
        <Button variant="secondary" href="/dashboard">{t('goHome')}</Button>
      </div>
    </main>
  );
}
