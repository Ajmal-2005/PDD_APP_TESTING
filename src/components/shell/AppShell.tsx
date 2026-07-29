'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthGate } from '@/components/AuthGate';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { CommandPalette } from './CommandPalette';
import { NavigationProgress } from './NavigationProgress';
import { PageTransition } from './PageTransition';
import { useScanSync } from '@/lib/hooks';
import { cx } from '@/lib/utils';

/**
 * Desktop shell: a permanent left rail plus a sticky top bar, with the routed
 * page scrolling between them. The sidebar becomes an off-canvas drawer below
 * the lg breakpoint - it is never a bottom tab bar.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const path = usePathname();
  const router = useRouter();

  // Mirror the user's Firestore scans into local IndexedDB in real time.
  useScanSync();

  // Background prefetch all app routes so screen clicks load in < 16ms
  useEffect(() => {
    const routes = [
      '/dashboard', '/scan', '/analytics', '/history', '/reports',
      '/library', '/settings', '/support', '/profile',
    ];
    routes.forEach((r) => {
      if (r !== path) router.prefetch(r);
    });
  }, [path, router]);

  useEffect(() => {
    setCollapsed(localStorage.getItem('agrovision.sidebarCollapsed') === 'true');
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((v) => {
      localStorage.setItem('agrovision.sidebarCollapsed', String(!v));
      return !v;
    });
  }, []);

  // Close the drawer on navigation so a link tap doesn't leave it hanging open.
  useEffect(() => { setMobileOpen(false); }, [path]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <AuthGate>
      <NavigationProgress />
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className={cx('flex min-h-screen flex-col transition-[padding] duration-300 ease-swift',
        collapsed ? 'lg:pl-sidebar-collapsed' : 'lg:pl-sidebar')}>
        <Topbar onOpenMobileNav={() => setMobileOpen(true)} onOpenSearch={() => setSearchOpen(true)} />
        <main className="flex-1 flex flex-col">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </AuthGate>
  );
}

/** Standard page frame: consistent gutters, max width and vertical rhythm. */
export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('mx-auto w-full max-w-shell shell-px py-6 lg:py-7', className)}>{children}</div>
  );
}

export function PageHeader({ title, subtitle, actions, className }: {
  title: string; subtitle?: string; actions?: ReactNode; className?: string;
}) {
  return (
    <div className={cx('mb-6 flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        <h1 className="text-title text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-[13.5px] leading-relaxed text-ink-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
