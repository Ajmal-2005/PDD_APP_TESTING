'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Scroll smoothly to top on screen transition
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    <div key={pathname} className="animate-page-enter flex-1 flex flex-col w-full">
      {children}
    </div>
  );
}
