'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3, Check, Cpu, Flame, Globe, LogOut, MapPin, Pencil, Settings, Sprout, Wifi, X,
} from 'lucide-react';
import { Page, PageHeader } from '@/components/shell/AppShell';
import {
  Button, EmptyState, FieldRow, Input, Panel, PanelBody, PanelHeader, RadialGauge,
  Skeleton, StatTile,
} from '@/components/ui';
import { useApp } from '@/providers/AppProvider';
import { useScans, useFarmDetails } from '@/lib/hooks';
import { logout } from '@/lib/auth-actions';
import { scanStreak } from '@/lib/utils';
import { LOCALE_NAMES } from '@/lib/i18n';

export default function ProfilePage() {
  const { t, user, locale, logoutApp } = useApp();
  const router = useRouter();
  const scans = useScans();
  const [farm, saveFarm] = useFarmDetails();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(farm);

  const stats = useMemo(() => {
    if (!scans) return null;
    const healthy = scans.filter((s) => s.disease === 'Healthy').length;
    return {
      total: scans.length,
      healthy,
      ratio: scans.length ? healthy / scans.length : 0,
      streak: scanStreak(scans.map((s) => s.timestamp)),
    };
  }, [scans]);

  const name = user?.displayName ?? user?.email?.split('@')[0] ?? t('farmerFallback');
  const initial = name.charAt(0).toUpperCase();
  // With no scans there is nothing to score: a red 0% reads as "your farm is in trouble"
  // when it actually means "no data yet". Show a neutral placeholder until the first scan.
  const hasScans = (stats?.total ?? 0) > 0;
  const healthColor = !hasScans
    ? 'rgb(var(--ink-3))'
    : (stats!.ratio) > 0.7 ? 'rgb(var(--risk-safe))'
    : (stats!.ratio) > 0.4 ? 'rgb(var(--risk-medium))'
    : 'rgb(var(--risk-high))';

  function beginEdit() { setDraft(farm); setEditing(true); }
  function commit() { saveFarm(draft); setEditing(false); }

  return (
    <Page>
      <PageHeader
        title={t('profile')}
        subtitle={t('profileSubtitle')}
        actions={<Button variant="secondary" href="/settings" icon={<Settings size={15} />}>{t('navSettings')}</Button>}
      />

      <div className="grid grid-cols-12 gap-4 lg:gap-5">
        {/* identity */}
        <div className="col-span-12 lg:col-span-4">
          <Panel className="h-full">
            <PanelBody className="flex flex-col items-center gap-3 text-center">
              <span className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-hover text-[30px] font-semibold text-brand-ink">
                {initial}
              </span>
              <div>
                <p className="text-title text-ink">{name}</p>
                {user?.email && <p className="mt-0.5 text-[13px] text-ink-3">{user.email}</p>}
              </div>
              {stats && (
                <div className="mt-2 flex items-center gap-5">
                  <RadialGauge value={hasScans ? stats.ratio : 0} size={96} stroke={8} color={healthColor}>
                    <span className="text-[18px] font-semibold tnum text-ink">
                      {hasScans ? `${(stats.ratio * 100).toFixed(0)}%` : '-'}
                    </span>
                  </RadialGauge>
                  <div className="text-left">
                    <p className="text-[14px] font-semibold text-ink">
                      {hasScans ? t('farmHealthScore') : t('noScansYet')}
                    </p>
                    <p className="mt-0.5 max-w-[10rem] text-[12px] leading-relaxed text-ink-3">
                      {hasScans ? t('healthyCropRatio') : t('scanInstruction')}
                    </p>
                  </div>
                </div>
              )}
            </PanelBody>
          </Panel>
        </div>

        {/* farm details */}
        <div className="col-span-12 lg:col-span-8">
          <Panel className="h-full">
            <PanelHeader
              title={t('farmDetails')}
              icon={<MapPin size={16} />}
              action={
                editing ? (
                  <div className="flex gap-1.5">
                    <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={() => setEditing(false)}>{t('cancel')}</Button>
                    <Button variant="primary" size="sm" icon={<Check size={14} />} onClick={commit}>{t('save')}</Button>
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" icon={<Pencil size={14} />} onClick={beginEdit}>{t('editDetails')}</Button>
                )
              }
            />
            <PanelBody>
              {editing ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldRow label={t('farmNameLabel')}>
                    <Input value={draft.farmName} onChange={(e) => setDraft({ ...draft, farmName: e.target.value })} />
                  </FieldRow>
                  <FieldRow label={t('region')}>
                    <Input value={draft.farmLocation} onChange={(e) => setDraft({ ...draft, farmLocation: e.target.value })} />
                  </FieldRow>
                  <FieldRow label={t('farmTypeLabel')} className="sm:col-span-2">
                    <Input value={draft.farmType} onChange={(e) => setDraft({ ...draft, farmType: e.target.value })} />
                  </FieldRow>
                </div>
              ) : (
                <dl className="grid gap-4 sm:grid-cols-3">
                  {[[t('farmLabel'), farm.farmName], [t('region'), farm.farmLocation], [t('typeLabel'), farm.farmType]].map(([k, v]) => (
                    <div key={k} className="rounded-lg border border-line bg-panel-2/50 px-3.5 py-3">
                      <dt className="text-[11.5px] uppercase tracking-wide text-ink-3">{k}</dt>
                      <dd className="mt-1 truncate text-[14px] font-medium text-ink">{v || '-'}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </PanelBody>
          </Panel>
        </div>

        {/* stats */}
        <div className="col-span-12">
          {stats === null ? (
            <div className="grid grid-cols-3 gap-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
              <StatTile label={t('totalScans')} value={stats.total} icon={<Sprout size={16} />} href="/analytics" />
              <StatTile label={t('healthyScans')} value={stats.healthy} icon={<Check size={16} />} href="/analytics" />
              <StatTile label={t('scanStreak')} value={stats.streak} icon={<Flame size={16} />} href="/analytics" />
              <StatTile label={t('farmIntelligence')} value="→" icon={<BarChart3 size={16} />} href="/analytics" />
            </div>
          )}
        </div>

        {/* engine status */}
        <div className="col-span-12">
          <Panel>
            <PanelHeader title={t('aiEngineActive')} icon={<Cpu size={16} />} />
            <PanelBody>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { icon: <Cpu size={15} />, text: t('aiModelOptimized') },
                  { icon: <Globe size={15} />, text: t('langEnabled', LOCALE_NAMES[locale]) },
                  { icon: <Wifi size={15} />, text: t('weatherSynced') },
                ].map((x, i) => (
                  <div key={i} className="flex items-center gap-2.5 rounded-lg border border-line bg-panel-2/50 px-3.5 py-3">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand/10 text-brand">{x.icon}</span>
                    <p className="text-[12.5px] text-ink-2">{x.text}</p>
                  </div>
                ))}
              </div>
            </PanelBody>
          </Panel>
        </div>

        <div className="col-span-12">
          <Button variant="ghost" icon={<LogOut size={16} />} className="text-risk-high hover:bg-risk-high/10"
            onClick={async () => { await logoutApp(); router.replace('/login'); }}>
            {t('logout')}
          </Button>
        </div>
      </div>
    </Page>
  );
}
