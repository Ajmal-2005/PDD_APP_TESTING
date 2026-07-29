'use client';

import { Skeleton } from '@/components/ui';

/** Shown automatically by Next.js during client-side route transitions inside (app). */
export default function AppGroupLoading() {
  return (
    <div className="mx-auto w-full max-w-shell shell-px py-6 lg:py-7">
      {/* Page header skeleton */}
      <div className="mb-6">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>
      {/* Content skeleton */}
      <div className="grid grid-cols-12 gap-4 lg:gap-5">
        <div className="col-span-12 grid grid-cols-2 gap-4 lg:gap-5 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[7.5rem]" />)}
        </div>
        <Skeleton className="col-span-12 h-80 xl:col-span-8" />
        <Skeleton className="col-span-12 h-80 md:col-span-6 xl:col-span-4" />
        <Skeleton className="col-span-12 h-72 xl:col-span-8" />
        <Skeleton className="col-span-12 h-72 md:col-span-6 xl:col-span-4" />
      </div>
    </div>
  );
}
