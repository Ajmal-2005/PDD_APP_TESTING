'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  Bell, Check, Globe, LogOut, Menu as MenuIcon, Moon, Search, Settings, Sun, User as UserIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/providers/AppProvider';
import { useScans } from '@/lib/hooks';
import { logout } from '@/lib/auth-actions';
import { LOCALES, LOCALE_NAMES } from '@/lib/i18n';
import { ALL_NAV_ITEMS, isActive } from './nav';
import { Badge, Menu, MenuItem, MenuLabel, MenuSeparator, RiskBadge } from '@/components/ui';
import { cx, formatDate } from '@/lib/utils';
import { useLabels } from '@/lib/labels';

export function Topbar({ onOpenMobileNav, onOpenSearch }: { onOpenMobileNav: () => void; onOpenSearch: () => void }) {
  const { t, dark, toggleDark, locale, setLocale, user, logoutApp } = useApp();
  const { diseaseName } = useLabels();
  const path = usePathname();
  const router = useRouter();
  const scans = useScans();
  const [readTime, setReadTime] = useState<number>(0);

  useEffect(() => {
    const saved = localStorage.getItem('agrovision.lastReadNotifications');
    if (saved) setReadTime(Number(saved));
  }, []);

  const current = ALL_NAV_ITEMS.find((i) => isActive(path, i.href));

  // "Notifications" are derived from real data: every scan sitting at HIGH risk.
  const alerts = useMemo(() => (scans ?? []).filter((s) => s.riskLevel === 'HIGH').slice(0, 6), [scans]);

  const unreadAlerts = useMemo(
    () => alerts.filter((s) => !readTime || new Date(s.timestamp).getTime() > readTime),
    [alerts, readTime],
  );

  const markNotificationsAsRead = () => {
    const now = Date.now();
    setReadTime(now);
    localStorage.setItem('agrovision.lastReadNotifications', now.toString());
  };

  const name = user?.displayName ?? user?.email?.split('@')[0] ?? t('farmerFallback');
  const initial = name.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-topbar shrink-0 items-center gap-2 border-b border-line bg-panel/85 px-3 backdrop-blur-xl lg:px-5">
      <button
        onClick={onOpenMobileNav}
        aria-label={t('openMenu')}
        className="rounded-lg p-2 text-ink-2 transition hover:bg-panel-2 hover:text-ink lg:hidden"
      >
        <MenuIcon size={19} />
      </button>

      <h1 className="truncate text-[14.5px] font-semibold text-ink lg:text-[15px]">
        {current ? t(current.key) : 'AgroVision'}
      </h1>

      {/* Search: a real control on desktop, an icon on small screens */}
      <button
        onClick={onOpenSearch}
        className="ml-auto hidden h-9 w-64 items-center gap-2 rounded-lg border border-line bg-panel-2/60 px-3 text-[13px] text-ink-3 transition hover:border-line-strong hover:bg-panel-2 md:flex xl:w-80"
      >
        <Search size={15} />
        <span className="flex-1 text-left">{t('searchEverything')}</span>
        <kbd className="rounded border border-line bg-panel px-1.5 py-0.5 text-[10.5px] font-medium">Ctrl K</kbd>
      </button>
      <button
        onClick={onOpenSearch}
        aria-label={t('searchEverything')}
        className="ml-auto rounded-lg p-2 text-ink-2 transition hover:bg-panel-2 hover:text-ink md:hidden"
      >
        <Search size={18} />
      </button>

      <div className="flex items-center gap-0.5">
        {/* Notifications */}
        <Menu
          width="w-80"
          label={t('notifications')}
          trigger={({ toggle, open }) => (
            <button
              onClick={() => {
                if (!open) markNotificationsAsRead();
                toggle();
              }}
              aria-label={t('notifications')}
              className="relative rounded-lg p-2 text-ink-2 transition hover:bg-panel-2 hover:text-ink"
            >
              <Bell size={18} />
              {unreadAlerts.length > 0 && (
                <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-risk-high px-1 text-[9.5px] font-bold text-white">
                  {unreadAlerts.length}
                </span>
              )}
            </button>
          )}
        >
          {({ close }) => (
            <>
              <MenuLabel>{t('riskAlerts')}</MenuLabel>
              {alerts.length === 0 ? (
                <p className="px-2.5 py-6 text-center text-[12.5px] text-ink-3">{t('noNotifications')}</p>
              ) : (
                alerts.map((s) => (
                  <MenuItem
                    key={s.id}
                    onClick={() => { router.push(`/history/${s.id}`); close(); }}
                    trailing={<RiskBadge level={s.riskLevel} size="sm" />}
                  >
                    <span className="block truncate">{diseaseName(s)}</span>
                    <span className="block truncate text-[11px] text-ink-3">{formatDate(s.timestamp, locale)}</span>
                  </MenuItem>
                ))
              )}
            </>
          )}
        </Menu>

        {/* Language */}
        <Menu
          width="w-44"
          label={t('language')}
          trigger={({ toggle }) => (
            <button
              onClick={toggle}
              aria-label={t('language')}
              className="hidden items-center gap-1.5 rounded-lg px-2 py-2 text-[13px] font-medium text-ink-2 transition hover:bg-panel-2 hover:text-ink sm:flex"
            >
              <Globe size={17} />
              <span className="uppercase">{locale}</span>
            </button>
          )}
        >
          {({ close }) => (
            <>
              <MenuLabel>{t('language')}</MenuLabel>
              {LOCALES.map((l) => (
                <MenuItem
                  key={l}
                  active={l === locale}
                  onClick={() => { setLocale(l); close(); }}
                  trailing={l === locale ? <Check size={14} className="text-brand" /> : undefined}
                >
                  {LOCALE_NAMES[l]}
                </MenuItem>
              ))}
            </>
          )}
        </Menu>

        {/* Theme */}
        <button
          onClick={toggleDark}
          aria-label={t('darkMode')}
          title={t('darkMode')}
          className="rounded-lg p-2 text-ink-2 transition hover:bg-panel-2 hover:text-ink"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Account */}
        <Menu
          label={t('profile')}
          trigger={({ toggle }) => (
            <button onClick={toggle} className="ml-1 flex items-center gap-2 rounded-lg p-1 transition hover:bg-panel-2">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-[12px] font-semibold text-brand-ink">
                {initial}
              </span>
            </button>
          )}
        >
          {({ close }) => (
            <>
              <div className="px-2.5 py-2">
                <p className="truncate text-[13.5px] font-medium text-ink">{name}</p>
                <p className="truncate text-[11.5px] text-ink-3">{user?.email ?? t('offlineMode')}</p>
              </div>
              <MenuSeparator />
              <MenuItem
                icon={<UserIcon size={15} />}
                onMouseEnter={() => router.prefetch('/profile')}
                onClick={() => { router.push('/profile'); close(); }}
              >
                {t('navProfile')}
              </MenuItem>
              <MenuItem
                icon={<Settings size={15} />}
                onMouseEnter={() => router.prefetch('/settings')}
                onClick={() => { router.push('/settings'); close(); }}
              >
                {t('navSettings')}
              </MenuItem>
              <MenuSeparator />
              <MenuItem
                icon={<LogOut size={15} />}
                danger
                onClick={async () => { close(); await logoutApp(); router.replace('/login'); }}
              >
                {t('logout')}
              </MenuItem>
            </>
          )}
        </Menu>
      </div>
    </header>
  );
}
