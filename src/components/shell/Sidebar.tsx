'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PanelLeftClose, PanelLeftOpen, Sparkles, X } from 'lucide-react';
import { useApp } from '@/providers/AppProvider';
import { useScans } from '@/lib/hooks';
import { cx } from '@/lib/utils';
import { NAV, isActive } from './nav';
import { Wordmark } from './Logo';
import { Button } from '@/components/ui';

export function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, onCloseMobile }: {
  collapsed: boolean; onToggleCollapsed: () => void; mobileOpen: boolean; onCloseMobile: () => void;
}) {
  const { t } = useApp();
  const path = usePathname();
  const router = useRouter();
  const scans = useScans();

  const counts: Record<string, number | undefined> = {
    '/history': scans?.length,
  };

  return (
    <>
      {/* Scrim - mobile only; on desktop the sidebar is permanent, not an overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 animate-fade-in bg-black/50 lg:hidden" onClick={onCloseMobile} aria-hidden />
      )}

      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-line bg-panel transition-[width,transform] duration-300 ease-swift',
          collapsed ? 'w-sidebar-collapsed' : 'w-sidebar',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className={cx('flex h-topbar shrink-0 items-center border-b border-line', collapsed ? 'justify-center px-2' : 'justify-between pl-4 pr-2')}>
          <Link href="/dashboard" onClick={onCloseMobile} className="rounded-lg">
            <Wordmark collapsed={collapsed} />
          </Link>
          <button
            onClick={onCloseMobile}
            aria-label={t('closeMenu')}
            className="rounded-lg p-1.5 text-ink-3 transition hover:bg-panel-2 hover:text-ink lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto scroll-thin px-2.5 py-4">
          {NAV.map((group) => (
            <div key={group.key}>
              {!collapsed && (
                <p className="px-2.5 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-3">
                  {t(group.key)}
                </p>
              )}
              <ul className="space-y-0.5">
                {group.items.map(({ href, icon: Icon, key }) => {
                  const active = isActive(path, href);
                  const count = counts[href];
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={onCloseMobile}
                        onMouseEnter={() => router.prefetch(href)}
                        title={collapsed ? t(key) : undefined}
                        aria-current={active ? 'page' : undefined}
                        className={cx(
                          'group relative flex items-center rounded-lg text-[13.5px] font-medium transition-all duration-200 ease-out active:scale-[0.98]',
                          collapsed ? 'h-9 justify-center' : 'h-9 gap-2.5 px-2.5',
                          active
                            ? 'bg-brand/10 text-brand font-semibold shadow-sm'
                            : 'text-ink-2 hover:bg-panel-2 hover:text-ink',
                        )}
                      >
                        {active && (
                          <span className="absolute -left-2.5 top-1/2 h-5 w-[3.5px] -translate-y-1/2 rounded-r-full bg-brand shadow-[0_0_8px_rgba(18,165,84,0.5)] transition-all duration-200" />
                        )}
                        <Icon size={17} strokeWidth={active ? 2.2 : 1.9} className="shrink-0" />
                        {!collapsed && <span className="min-w-0 flex-1 truncate">{t(key)}</span>}
                        {!collapsed && count !== undefined && count > 0 && (
                          <span className="shrink-0 rounded bg-panel-2 px-1.5 py-px text-[11px] tnum text-ink-3">
                            {count}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {!collapsed && (
          <div className="mx-2.5 mb-2 rounded-xl border border-line bg-gradient-to-b from-brand/10 to-transparent p-3">
            <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink">
              <Sparkles size={14} className="text-brand" />
              {t('sidebarCtaTitle')}
            </p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-ink-3">{t('sidebarCtaBody')}</p>
            <Button href="/scan" variant="primary" size="sm" full className="mt-2.5">{t('navScanCrops')}</Button>
          </div>
        )}

        <div className={cx('shrink-0 border-t border-line p-2.5', collapsed && 'flex justify-center')}>
          <button
            onClick={onToggleCollapsed}
            aria-label={collapsed ? t('expandSidebar') : t('collapseSidebar')}
            title={collapsed ? t('expandSidebar') : t('collapseSidebar')}
            className={cx(
              'hidden items-center rounded-lg text-[13px] font-medium text-ink-3 transition hover:bg-panel-2 hover:text-ink lg:flex',
              collapsed ? 'h-9 w-9 justify-center' : 'h-9 w-full gap-2.5 px-2.5',
            )}
          >
            {collapsed ? <PanelLeftOpen size={17} /> : <><PanelLeftClose size={17} />{t('collapseSidebar')}</>}
          </button>
        </div>
      </aside>
    </>
  );
}
