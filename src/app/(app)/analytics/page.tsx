'use client';

import { useMemo, useState } from 'react';
import {
  Activity, BarChart3, CalendarDays, Flame, Gauge, Leaf, Sprout, TrendingUp,
} from 'lucide-react';
import { Page, PageHeader } from '@/components/shell/AppShell';
import {
  EmptyState, Panel, PanelBody, PanelHeader, RadialGauge, SegmentedControl,
  Skeleton, StatTile, Tabs, type TabItem,
} from '@/components/ui';
import { AreaTrend } from '@/components/charts/AreaTrend';
import { BarList, ColumnChart } from '@/components/charts/BarList';
import { Donut } from '@/components/charts/Donut';
import { Heatmap, buildHeatCells } from '@/components/charts/Heatmap';
import { ScatterPlot } from '@/components/charts/ScatterPlot';
import { seriesColor } from '@/components/charts/chart-utils';
import { useApp } from '@/providers/AppProvider';
import { useScans } from '@/lib/hooks';
import { computeStats, foldTail, inRange, previousWindow, type RangeKey } from '@/lib/stats';
import { riskColor } from '@/components/ui';
import { scanStreak } from '@/lib/utils';
import { diseaseKey, useLabels } from '@/lib/labels';
import type { StringKey } from '@/lib/i18n';

type Tab = 'overview' | 'diseases' | 'activity' | 'model';

export default function AnalyticsPage() {
  const { t, locale } = useApp();
  const all = useScans();
  const [range, setRange] = useState<RangeKey>('90');
  const [tab, setTab] = useState<Tab>('overview');

  const scans = useMemo(() => (all ? inRange(all, range) : []), [all, range]);
  const prev = useMemo(() => (all ? previousWindow(all, range) : []), [all, range]);
  const stats = useMemo(() => computeStats(scans, locale), [scans, locale]);
  const prevStats = useMemo(() => computeStats(prev, locale), [prev, locale]);

  const tabs: TabItem<Tab>[] = [
    { value: 'overview', label: t('tabOverview'), icon: <BarChart3 size={14} /> },
    { value: 'diseases', label: t('tabDiseases'), icon: <Leaf size={14} /> },
    { value: 'activity', label: t('tabActivity'), icon: <CalendarDays size={14} /> },
    { value: 'model', label: t('tabModel'), icon: <Gauge size={14} /> },
  ];
  const ranges: { value: RangeKey; label: string }[] = [
    { value: '7', label: t('last7') },
    { value: '30', label: t('last30') },
    { value: '90', label: t('last90') },
    { value: 'all', label: t('allTime') },
  ];

  if (all === undefined) {
    return <Page><PageHeader title={t('navAnalytics')} subtitle={t('analyticsSubtitle')} /><div className="grid grid-cols-4 gap-4"><Skeleton className="col-span-4 h-96" /></div></Page>;
  }

  const empty = stats.total === 0;

  return (
    <Page>
      <PageHeader
        title={t('navAnalytics')}
        subtitle={t('analyticsSubtitle')}
        actions={<SegmentedControl items={ranges} value={range} onChange={setRange} />}
      />

      <div className="mb-5"><Tabs items={tabs} value={tab} onChange={setTab} /></div>

      {empty ? (
        <Panel><EmptyState icon={<Sprout size={22} />} title={t('needMoreScans')} hint={t('needMoreScansHint')} /></Panel>
      ) : (
        <>
          {tab === 'overview' && <OverviewTab stats={stats} prevStats={prevStats} scans={scans} />}
          {tab === 'diseases' && <DiseasesTab stats={stats} scans={scans} />}
          {tab === 'activity' && <ActivityTab stats={stats} scans={scans} locale={locale} />}
          {tab === 'model' && <ModelTab stats={stats} scans={scans} />}
        </>
      )}
    </Page>
  );
}

type Stats = ReturnType<typeof computeStats>;

function OverviewTab({ stats, prevStats, scans }: { stats: Stats; prevStats: Stats; scans: import('@/lib/db').Scan[] }) {
  const { t } = useApp();
  const { diseaseSeries } = useLabels();
  const trend = stats.driSeries.slice(-20).map((p) => ({ label: p.label, values: [p.value] }));
  const distribution = foldTail(diseaseSeries(stats.byDisease), 4, t('allTypes'))
    .map((d, i) => ({ ...d, color: seriesColor(i) }));
  const health = stats.healthRatio;
  const healthColor = health > 0.7 ? 'rgb(var(--risk-safe))' : health > 0.4 ? 'rgb(var(--risk-medium))' : 'rgb(var(--risk-high))';

  return (
    <div className="grid grid-cols-12 gap-4 lg:gap-5">
      <div className="col-span-12 grid grid-cols-2 gap-4 lg:gap-5 xl:grid-cols-4">
        <StatTile label={t('totalScansLabel')} value={stats.total} icon={<BarChart3 size={16} />}
          delta={prevStats.total ? stats.total - prevStats.total : undefined} deltaLabel={t('vsPrevious')} />
        <StatTile label={t('avgDriLabel')} value={stats.avgDri.toFixed(1)} unit="/ 10" icon={<Activity size={16} />}
          delta={prevStats.total ? stats.avgDri - prevStats.avgDri : undefined} deltaLabel={t('vsPrevious')} deltaGoodWhen="down" />
        <StatTile label={t('avgConfidence')} value={`${(stats.avgConfidence * 100).toFixed(0)}%`} icon={<Gauge size={16} />}
          delta={prevStats.total ? (stats.avgConfidence - prevStats.avgConfidence) * 100 : undefined} deltaLabel={t('vsPrevious')} />
        <StatTile label={t('highRiskLabel')} value={stats.highRisk} icon={<Flame size={16} />}
          delta={prevStats.total ? stats.highRisk - prevStats.highRisk : undefined} deltaLabel={t('vsPrevious')} deltaGoodWhen="down" />
      </div>

      <div className="col-span-12 xl:col-span-8">
        <Panel className="h-full">
          <PanelHeader title={t('scanTrends')} subtitle={t('scanTrendsHint')} icon={<TrendingUp size={16} />} />
          <PanelBody>
            {trend.length < 2
              ? <EmptyState compact icon={<Activity size={20} />} title={t('needMoreScans')} />
              : <AreaTrend data={trend} seriesNames={[t('driLabel')]} height={260} valueSuffix=" / 10" />}
          </PanelBody>
        </Panel>
      </div>

      <div className="col-span-12 xl:col-span-4">
        <Panel className="flex h-full flex-col">
          <PanelHeader title={t('farmHealth')} icon={<Sprout size={16} />} />
          <PanelBody className="flex flex-1 flex-col items-center justify-center gap-3">
            <RadialGauge value={health} size={150} color={healthColor}>
              <span className="text-[30px] font-semibold tnum text-ink">{(health * 100).toFixed(0)}%</span>
              <span className="text-[10.5px] uppercase text-ink-3">{t('healthyShare')}</span>
            </RadialGauge>
            <p className="text-[13px] font-semibold" style={{ color: healthColor }}>
              {health > 0.7 ? t('excellent') : health > 0.4 ? t('moderate') : t('critical')}
            </p>
            <p className="text-center text-[12px] text-ink-3">{t('basedOnScans')}</p>
          </PanelBody>
        </Panel>
      </div>

      <div className="col-span-12 lg:col-span-6">
        <Panel className="h-full">
          <PanelHeader title={t('diseaseDistribution')} icon={<Leaf size={16} />} />
          <PanelBody>
            <Donut slices={distribution} centerLabel={t('totalScansLabel')} centerValue={String(stats.total)} />
          </PanelBody>
        </Panel>
      </div>

      <div className="col-span-12 lg:col-span-6">
        <Panel className="h-full">
          <PanelHeader title={t('scanVolume')} subtitle={t('scanVolumeHint')} icon={<CalendarDays size={16} />} />
          <PanelBody>
            <ColumnChart data={stats.perDay.slice(-30)} height={200} />
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}

function DiseasesTab({ stats, scans }: { stats: Stats; scans: import('@/lib/db').Scan[] }) {
  const { t } = useApp();
  const { diseaseText, diseaseSeries } = useLabels();
  // Filter on the canonical name first - 'Healthy' is the stored value, not a display one.
  const top = diseaseSeries(stats.byDisease.filter((d) => d.label !== 'Healthy').slice(0, 8))
    .map((d, i) => ({ ...d, color: seriesColor(i % 5) }));

  // Mean confidence per disease - a proxy for how sure the model is per class.
  const confByDisease = useMemo(() => {
    const acc = new Map<string, { sum: number; n: number }>();
    for (const s of scans) {
      const e = acc.get(s.disease) ?? { sum: 0, n: 0 };
      e.sum += s.confidence; e.n += 1;
      acc.set(s.disease, e);
    }
    return [...acc.entries()]
      // Aggregate on the canonical key, translate only for display.
      .map(([label, { sum, n }]) => ({ label: diseaseText(label), value: Math.round((sum / n) * 100) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- diseaseText is derived from `t`
  }, [scans, t]);

  return (
    <div className="grid grid-cols-12 gap-4 lg:gap-5">
      <div className="col-span-12 lg:col-span-6">
        <Panel className="h-full">
          <PanelHeader title={t('topDetectionLogs')} icon={<Leaf size={16} />} />
          <PanelBody>
            {top.length === 0
              ? <EmptyState compact icon={<Leaf size={20} />} title={t('needMoreScans')} />
              : <BarList data={top} valueSuffix="" />}
          </PanelBody>
        </Panel>
      </div>
      <div className="col-span-12 lg:col-span-6">
        <Panel className="h-full">
          <PanelHeader title={t('confidenceSpread')} subtitle={t('confidenceSpreadHint')} icon={<Gauge size={16} />} />
          <PanelBody>
            <BarList data={confByDisease} valueSuffix="%" barColor="rgb(var(--series-2))" />
          </PanelBody>
        </Panel>
      </div>
      <div className="col-span-12">
        <Panel>
          <PanelHeader title={t('tomatoHealthDist')} icon={<Sprout size={16} />} />
          <PanelBody>
            <div className="mb-2 flex h-3 overflow-hidden rounded-full">
              {stats.healthy > 0 && <div className="bg-risk-safe" style={{ width: `${stats.healthRatio * 100}%` }} />}
              {stats.healthy > 0 && stats.diseased > 0 && <div className="w-0.5 bg-panel" />}
              {stats.diseased > 0 && <div className="bg-risk-high" style={{ width: `${(1 - stats.healthRatio) * 100}%` }} />}
            </div>
            <div className="flex justify-between text-[12.5px]">
              <span className="inline-flex items-center gap-1.5 text-ink-2"><span className="h-2 w-2 rounded-sm bg-risk-safe" />{t('healthy')} · <span className="font-semibold text-ink tnum">{stats.healthy}</span></span>
              <span className="inline-flex items-center gap-1.5 text-ink-2"><span className="h-2 w-2 rounded-sm bg-risk-high" />{t('diseased')} · <span className="font-semibold text-ink tnum">{stats.diseased}</span></span>
            </div>
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}

function ActivityTab({ stats, scans, locale }: { stats: Stats; scans: import('@/lib/db').Scan[]; locale: string }) {
  const { t } = useApp();
  const streak = scanStreak(scans.map((s) => s.timestamp));
  const cells = buildHeatCells(scans.map((s) => s.timestamp));
  const weekdays = locale === 'ta'
    ? ['ஞா', 'தி', 'செ', 'பு', 'வி', 'வெ', 'ச']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const busiest = Math.max(...cells.map((c) => c.count), 0);

  return (
    <div className="grid grid-cols-12 gap-4 lg:gap-5">
      <div className="col-span-12 grid grid-cols-3 gap-4 lg:gap-5">
        <StatTile label={t('scanStreak')} value={streak} unit={t('daysCount', streak).replace(String(streak), '').trim()} icon={<Flame size={16} />} />
        <StatTile label={t('scanVolume')} value={stats.total} icon={<CalendarDays size={16} />} />
        <StatTile label={t('more')} value={busiest} icon={<TrendingUp size={16} />} />
      </div>
      <div className="col-span-12">
        <Panel>
          <PanelHeader title={t('activityHeatmap')} icon={<CalendarDays size={16} />} />
          <PanelBody>
            <Heatmap cells={cells} weekdayLabels={weekdays} lessLabel={t('less')} moreLabel={t('more')} locale={locale} />
          </PanelBody>
        </Panel>
      </div>
      <div className="col-span-12">
        <Panel>
          <PanelHeader title={t('scanVolume')} subtitle={t('scanVolumeHint')} icon={<BarChart3 size={16} />} />
          <PanelBody><ColumnChart data={stats.perDay} height={190} /></PanelBody>
        </Panel>
      </div>
    </div>
  );
}

function ModelTab({ stats, scans }: { stats: Stats; scans: import('@/lib/db').Scan[] }) {
  const { t } = useApp();
  const { riskName } = useLabels();
  // Humidity vs DRI: does the model's risk output track the environmental driver?
  const points = scans.map((s) => ({ x: s.humidity, y: s.driScore, label: t(diseaseKey(s.disease)), color: riskColor(s.riskLevel) }));
  // `level` is the stored constant ('HIGH'...), never a display string.
  const riskMix = stats.byRisk.filter((r) => r.value > 0)
    .map((r) => ({ label: riskName(r.level), value: r.value, color: riskColor(r.level) }));

  return (
    <div className="grid grid-cols-12 gap-4 lg:gap-5">
      <div className="col-span-12 grid grid-cols-2 gap-4 lg:gap-5">
        <StatTile label={t('avgConfidence')} value={`${(stats.avgConfidence * 100).toFixed(1)}%`} icon={<Gauge size={16} />} />
        <StatTile label={t('avgDriLabel')} value={stats.avgDri.toFixed(1)} unit="/ 10" icon={<Activity size={16} />} />
      </div>
      <div className="col-span-12 lg:col-span-7">
        <Panel className="h-full">
          <PanelHeader title={t('weatherCorrelation')} subtitle={t('weatherCorrelationHint')} icon={<TrendingUp size={16} />} />
          <PanelBody>
            {points.length < 2
              ? <EmptyState compact icon={<TrendingUp size={20} />} title={t('needMoreScans')} />
              : <ScatterPlot points={points} xLabel={t('humidity')} yLabel={t('driLabel')} xSuffix="%" xMax={100} yMax={10} height={260} />}
          </PanelBody>
        </Panel>
      </div>
      <div className="col-span-12 lg:col-span-5">
        <Panel className="h-full">
          <PanelHeader title={t('riskMix')} icon={<Flame size={16} />} />
          <PanelBody>
            <Donut slices={riskMix} centerLabel={t('totalScansLabel')} centerValue={String(stats.total)} />
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}
