'use client';

import { Spinner } from '@/components/ui';

/** Shown during root-level transitions (splash → auth pages, language picker). */
export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center text-brand">
      <Spinner size={28} />
    </div>
  );
}
