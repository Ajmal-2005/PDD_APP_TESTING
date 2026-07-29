'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function NavigationProgress() {
  const pathname = usePathname();
  const [animating, setAnimating] = useState(false);
  const [width, setWidth] = useState(0);

  // Complete and hide instantly when pathname updates
  useEffect(() => {
    setWidth(100);
    const t = setTimeout(() => {
      setAnimating(false);
      setWidth(0);
    }, 150);
    return () => clearTimeout(t);
  }, [pathname]);

  // Intercept link clicks for instant visual feedback
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (href && href.startsWith('/') && !href.startsWith('//') && href !== pathname) {
        setAnimating(true);
        setWidth(45);
        setTimeout(() => setWidth(85), 60);
      }
    };

    document.addEventListener('click', handleAnchorClick, { capture: true });
    return () => document.removeEventListener('click', handleAnchorClick, { capture: true });
  }, [pathname]);

  if (!animating && width === 0) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[2.5px] overflow-hidden bg-transparent"
    >
      <div
        className="h-full bg-gradient-to-r from-brand via-emerald-400 to-green-300 shadow-[0_0_8px_rgba(18,165,84,0.6)] transition-all duration-150 ease-out"
        style={{
          width: `${width}%`,
          opacity: width === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
