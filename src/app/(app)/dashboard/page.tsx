'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity, AlertOctagon, ArrowRight, Droplets, Leaf, ScanLine, ShieldCheck, Sprout, Sun,
} from 'lucide-react';
import { Page, PageHeader } from '@/components/shell/AppShell';
import {
  Badge, Button, EmptyState, Panel, PanelBody, PanelHeader, PanelLink,
  RiskBadge, ScanThumb, SegmentedControl, Skeleton, StatTile, DataTable, Th, Td, Tr,
} from '@/components/ui';
import { AreaTrend } from '@/components/charts/AreaTrend';
import { Donut } from '@/components/charts/Donut';
import { seriesColor } from '@/components/charts/chart-utils';
import { Dropzone } from '@/components/Dropzone';
import { WeatherPanel } from '@/components/WeatherPanel';
import { useApp } from '@/providers/AppProvider';
import { useScans } from '@/lib/hooks';
import { computeStats, foldTail, inRange, previousWindow, type RangeKey } from '@/lib/stats';
import { greetingKey, formatDate } from '@/lib/utils';
import { useLabels } from '@/lib/labels';
import type { StringKey } from '@/lib/i18n';

const INSIGHTS: { icon: typeof Droplets; title: StringKey; desc: StringKey }[] = [
  { icon: Droplets, title: 'insightWaterTitle', desc: 'insightWaterDesc' },
  { icon: Sprout, title: 'insightSoilTitle', desc: 'insightSoilDesc' },
  { icon: Sun, title: 'insightWeatherTitle', desc: 'insightWeatherDesc' },
];

export default function DashboardPage() {
  const { t, locale, user } = useApp();
  const { diseaseName, diseaseSeries } = useLabels();
  const router = useRouter();
  const all = useScans();
  const [range, setRange] = useState<RangeKey>('30');

  const scans = useMemo(() => (all ? inRange(all, range) : []), [all, range]);
  const prev = useMemo(() => (all ? previousWindow(all, range) : []), [all, range]);

  const stats = useMemo(() => computeStats(scans, locale), [scans, locale]);
  const prevStats = useMemo(() => computeStats(prev, locale), [prev, locale]);

  const distribution = useMemo(
    () => foldTail(diseaseSeries(stats.byDisease), 4, t('allTypes'))
      .map((d, i) => ({ ...d, color: seriesColor(i) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- diseaseSeries is derived from `t`
    [stats.byDisease, t],
  );

  const trend = useMemo(
    () => stats.driSeries.slice(-14).map((p) => ({ label: p.label, values: [p.value] })),
    [stats.driSeries],
  );

  const alerts = useMemo(() => scans.filter((s) => s.riskLevel === 'HIGH').slice(0, 5), [scans]);
  const recent = scans.slice(0, 6);

  const firstName = user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? t('farmerFallback');
  const loading = all === undefined;

  const ranges: { value: RangeKey; label: string }[] = [
    { value: '7', label: t('last7') },
    { value: '30', label: t('last30') },
    { value: '90', label: t('last90') },
    { value: 'all', label: t('allTime') },
  ];

  return (
    <Page>
      <PageHeader
        title={`${t(greetingKey())}, ${firstName}`}
        subtitle={t('dashSubtitle')}
        actions={
          <>
            <SegmentedControl items={ranges} value={range} onChange={setRange} />
            <Button variant="primary" href="/scan" icon={<ScanLine size={16} />}>{t('navScanCrops')}</Button>
          </>
        }
      />

      {loading ? <DashboardSkeleton /> : (
        <div className="grid grid-cols-12 gap-4 lg:gap-5">
          {/* ---- KPI row ---- */}
          <div className="col-span-12 grid grid-cols-2 gap-4 lg:gap-5 xl:grid-cols-4">
            <StatTile
              label={t('farmHealth')}
              value={`${(stats.healthRatio * 100).toFixed(0)}%`}
              icon={<ShieldCheck size={16} />}
              delta={prevStats.total ? (stats.healthRatio - prevStats.healthRatio) * 100 : undefined}
              deltaLabel={t('vsPrevious')}
              deltaGoodWhen="up"
            />
            <StatTile
              label={t('totalScansLabel')}
              value={stats.total}
              icon={<ScanLine size={16} />}
              delta={prevStats.total ? stats.total - prevStats.total : undefined}
              deltaLabel={t('vsPrevious')}
              trend={stats.perDay.slice(-12).map((d) => d.value)}
            />
            <StatTile
              label={t('highRiskLabel')}
              value={stats.highRisk}
              icon={<AlertOctagon size={16} />}
              delta={prevStats.total ? stats.highRisk - prevStats.highRisk : undefined}
              deltaLabel={t('vsPrevious')}
              deltaGoodWhen="down"
            />
            <StatTile
              label={t('avgDriLabel')}
              value={stats.avgDri.toFixed(1)}
              unit="/ 10"
              icon={<Activity size={16} />}
              delta={prevStats.total ? stats.avgDri - prevStats.avgDri : undefined}
              deltaLabel={t('vsPrevious')}
              deltaGoodWhen="down"
            />
          </div>

          {/* ---- Trend + conditions ---- */}
          <div className="col-span-12 xl:col-span-8">
            <Panel className="h-full">
              <PanelHeader
                title={t('scanTrends')}
                subtitle={t('scanTrendsHint')}
                icon={<Activity size={16} />}
                action={<PanelLink href="/analytics">{t('navAnalytics')}</PanelLink>}
              />
              <PanelBody>
                {trend.length < 2 ? (
                  <EmptyState compact icon={<Activity size={20} />} title={t('needMoreScans')} hint={t('needMoreScansHint')} />
                ) : (
                  <AreaTrend data={trend} seriesNames={[t('driLabel')]} height={236} valueSuffix=" / 10" />
                )}
              </PanelBody>
            </Panel>
          </div>

          <div className="col-span-12 md:col-span-6 xl:col-span-4">
            <WeatherPanel scans={all} />
          </div>

          {/* ---- Recent detections table ---- */}
          <div className="col-span-12 xl:col-span-8">
            <Panel className="flex h-full flex-col overflow-hidden">
              <PanelHeader
                title={t('recentDetections')}
                icon={<Leaf size={16} />}
                action={<PanelLink href="/history">{t('viewAll')}</PanelLink>}
              />
              {recent.length === 0 ? (
                <EmptyState
                  icon={<ScanLine size={20} />}
                  title={t('noScans')}
                  hint={t('scanInstruction')}
                  action={<Button variant="primary" href="/scan" icon={<ScanLine size={15} />}>{t('navScanCrops')}</Button>}
                />
              ) : (
                <DataTable>
                  <thead>
                    <tr>
                      <Th>{t('colDisease')}</Th>
                      <Th>{t('colDate')}</Th>
                      <Th align="right">{t('colConfidence')}</Th>
                      <Th align="right">{t('colDri')}</Th>
                      <Th align="right">{t('colRisk')}</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((s) => (
                      <Tr key={s.id} onClick={() => router.push(`/history/${s.id}`)}>
                        <Td>
                          <div className="flex items-center gap-3">
                            <ScanThumb src={s.imageDataUrl} remoteSrc={s.imageUrl} className="h-9 w-9 shrink-0 rounded-lg border border-line object-cover" iconSize={15} />
                            <span className="truncate font-medium text-ink">{diseaseName(s)}</span>
                          </div>
                        </Td>
                        <Td className="whitespace-nowrap text-[12.5px]">{formatDate(s.timestamp, locale)}</Td>
                        <Td align="right">{(s.confidence * 100).toFixed(0)}%</Td>
                        <Td align="right" className="font-medium text-ink">{s.driScore.toFixed(1)}</Td>
                        <Td align="right"><RiskBadge level={s.riskLevel} size="sm" /></Td>
                      </Tr>
                    ))}
                  </tbody>
                </DataTable>
              )}
            </Panel>
          </div>

          {/* ---- Alerts / actions ---- */}
          <div className="col-span-12 md:col-span-6 xl:col-span-4">
            <Panel className="h-full">
              <PanelHeader
                title={t('recommendedActions')}
                icon={<AlertOctagon size={16} />}
                action={alerts.length > 0 ? <Badge tone="high">{alerts.length}</Badge> : undefined}
              />
              <PanelBody className="space-y-2.5">
                {alerts.length === 0 ? (
                  <EmptyState compact icon={<ShieldCheck size={20} />} title={t('noAlertsTitle')} hint={t('noAlertsBody')} />
                ) : alerts.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => router.push(`/history/${s.id}`)}
                    className="group flex w-full items-start gap-3 rounded-lg border border-line bg-panel-2/50 p-3 text-left transition hover:border-risk-high/40 hover:bg-risk-high/5"
                  >
                    <span className="mt-0.5 shrink-0 text-risk-high"><AlertOctagon size={15} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium text-ink">
                        {diseaseName(s)}
                      </span>
                      <span className="mt-0.5 block truncate text-[12px] leading-relaxed text-ink-3">
                        {s.treatment.split('\n')[0]}
                      </span>
                    </span>
                    <ArrowRight size={14} className="mt-1 shrink-0 text-ink-3 transition group-hover:translate-x-0.5 group-hover:text-risk-high" />
                  </button>
                ))}
              </PanelBody>
            </Panel>
          </div>

          {/* ---- Distribution + quick scan ---- */}
          <div className="col-span-12 lg:col-span-6 xl:col-span-5">
            <Panel className="h-full">
              <PanelHeader title={t('diseaseDistribution')} icon={<Leaf size={16} />} />
              <PanelBody>
                {distribution.length === 0 ? (
                  <EmptyState compact icon={<Leaf size={20} />} title={t('needMoreScans')} hint={t('needMoreScansHint')} />
                ) : (
                  <Donut slices={distribution} centerLabel={t('totalScansLabel')} centerValue={String(stats.total)} />
                )}
              </PanelBody>
            </Panel>
          </div>

          <div className="col-span-12 lg:col-span-6 xl:col-span-7">
            <Panel className="h-full">
              <PanelHeader title={t('quickScanTitle')} subtitle={t('quickScanBody')} icon={<ScanLine size={16} />} />
              <PanelBody>
                <Dropzone
                  title={t('dropzoneTitle')}
                  hint={t('dropzoneHint')}
                  browseLabel={t('browseFiles')}
                  onFile={(dataUrl) => {
                    // Hand off to the workspace, which owns the whole scan flow.
                    sessionStorage.setItem('agrovision.pendingImage', dataUrl);
                    router.push('/scan');
                  }}
                />
                <Button variant="secondary" href="/scan" full className="mt-3" icon={<ScanLine size={15} />}>
                  {t('openWorkspace')}
                </Button>
              </PanelBody>
            </Panel>
          </div>

          {/* ---- Agronomy insights ---- */}
          <div className="col-span-12">
            <div className="grid gap-4 lg:gap-5 md:grid-cols-3">
              {INSIGHTS.map(({ icon: Icon, title, desc }) => (
                <Panel key={title} className="p-4">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand/10 text-brand">
                    <Icon size={17} />
                  </span>
                  <p className="mt-3 text-[14px] font-semibold text-ink">{t(title)}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{t(desc)}</p>
                </Panel>
              ))}
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-4 lg:gap-5">
      <div className="col-span-12 grid grid-cols-2 gap-4 lg:gap-5 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[7.5rem]" />)}
      </div>
      <Skeleton className="col-span-12 h-80 xl:col-span-8" />
      <Skeleton className="col-span-12 h-80 md:col-span-6 xl:col-span-4" />
      <Skeleton className="col-span-12 h-72 xl:col-span-8" />
      <Skeleton className="col-span-12 h-72 md:col-span-6 xl:col-span-4" />
    </div>
  );
}
