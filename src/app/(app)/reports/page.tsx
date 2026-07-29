'use client';

import { useMemo, useState } from 'react';
import { FileDown, FileText, Sheet } from 'lucide-react';
import { Page, PageHeader } from '@/components/shell/AppShell';
import {
  Button, DataTable, EmptyState, Panel, PanelBody, PanelHeader, RiskBadge,
  SegmentedControl, Skeleton, StatTile, Td, Th, Tr,
} from '@/components/ui';
import { Donut } from '@/components/charts/Donut';
import { seriesColor } from '@/components/charts/chart-utils';
import { useApp } from '@/providers/AppProvider';
import { useScans } from '@/lib/hooks';
import { computeStats, foldTail, inRange, type RangeKey } from '@/lib/stats';
import { generateReport } from '@/lib/pdf';
import { exportScansCsv } from '@/lib/csv';
import { formatDate } from '@/lib/utils';
import { useLabels } from '@/lib/labels';

export default function ReportsPage() {
  const { t, locale } = useApp();
  const { diseaseName, diseaseSeries } = useLabels();
  const all = useScans();
  const [range, setRange] = useState<RangeKey>('30');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const scans = useMemo(() => (all ? inRange(all, range) : []), [all, range]);
  const stats = useMemo(() => computeStats(scans, locale), [scans, locale]);
  const distribution = useMemo(
    () => foldTail(diseaseSeries(stats.byDisease), 4, t('allTypes'))
      .map((d, i) => ({ ...d, color: seriesColor(i) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- diseaseSeries is derived from `t`
    [stats.byDisease, t],
  );

  const chosen = useMemo(
    () => (selected.size ? scans.filter((s) => selected.has(s.id)) : scans),
    [scans, selected],
  );

  const ranges: { value: RangeKey; label: string }[] = [
    { value: '7', label: t('last7') },
    { value: '30', label: t('last30') },
    { value: '90', label: t('last90') },
    { value: 'all', label: t('allTime') },
  ];

  const allChecked = scans.length > 0 && selected.size === scans.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected(allChecked ? new Set() : new Set(scans.map((s) => s.id)));
  }

  function exportPdf() {
    // One full report per scan - the same layout as the single-scan download.
    chosen.slice(0, 20).forEach((s, i) =>
      setTimeout(() => {
        try { generateReport(s); }
        catch (err) { console.error('[AgroVision] PDF generation failed for', s.id, err); }
      }, i * 120),
    );
  }

  if (all === undefined) {
    return <Page><PageHeader title={t('navReports')} subtitle={t('reportsSubtitle')} /><Skeleton className="h-96" /></Page>;
  }

  return (
    <Page>
      <PageHeader
        title={t('navReports')}
        subtitle={t('reportsSubtitle')}
        actions={<SegmentedControl items={ranges} value={range} onChange={setRange} />}
      />

      <div className="grid grid-cols-12 gap-4 lg:gap-5">
        {/* summary rail */}
        <div className="col-span-12 space-y-4 lg:col-span-4">
          <div className="grid grid-cols-2 gap-4">
            <StatTile label={t('totalScansLabel')} value={stats.total} icon={<FileText size={15} />} />
            <StatTile label={t('highRiskLabel')} value={stats.highRisk} />
            <StatTile label={t('healthyShare')} value={`${(stats.healthRatio * 100).toFixed(0)}%`} />
            <StatTile label={t('avgDriLabel')} value={stats.avgDri.toFixed(1)} unit="/10" />
          </div>

          <Panel>
            <PanelHeader title={t('periodBreakdown')} icon={<FileText size={16} />} />
            <PanelBody>
              {distribution.length === 0
                ? <EmptyState compact title={t('noScansInPeriod')} />
                : <Donut slices={distribution} centerLabel={t('totalScansLabel')} centerValue={String(stats.total)} size={150} />}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title={t('reportSummary')} />
            <PanelBody className="space-y-3">
              <p className="text-[12.5px] leading-relaxed text-ink-3">{t('exportHint')}</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" icon={<Sheet size={15} />} disabled={chosen.length === 0}
                  onClick={() => exportScansCsv(chosen, `agrovision-${range}.csv`)}>
                  {t('exportCsv')}
                </Button>
                <Button variant="primary" icon={<FileDown size={15} />} disabled={chosen.length === 0} onClick={exportPdf}>
                  {t('exportPdfAll')}
                </Button>
              </div>
              <p className="text-center text-[11.5px] text-ink-3">
                {selected.size > 0 ? t('selectedCount', selected.size) : t('resultsCount', chosen.length, scans.length)}
              </p>
            </PanelBody>
          </Panel>
        </div>

        {/* table */}
        <div className="col-span-12 lg:col-span-8">
          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
              <p className="text-[13px] font-medium text-ink">{t('reportPeriod')}: {ranges.find((r) => r.value === range)?.label}</p>
              {scans.length > 0 && (
                <button onClick={toggleAll} className="text-[12.5px] font-medium text-brand transition hover:underline">
                  {allChecked ? t('clearSelection') : t('selectAll')}
                </button>
              )}
            </div>

            {scans.length === 0 ? (
              <EmptyState icon={<FileText size={22} />} title={t('noScansInPeriod')} hint={t('needMoreScansHint')} />
            ) : (
              <DataTable>
                <thead>
                  <tr>
                    <Th width="3rem" />
                    <Th>{t('colDisease')}</Th>
                    <Th>{t('colDate')}</Th>
                    <Th align="right">{t('colConfidence')}</Th>
                    <Th align="right">{t('colRisk')}</Th>
                    <Th align="right" width="3.5rem" />
                  </tr>
                </thead>
                <tbody>
                  {scans.map((s) => {
                    const checked = selected.has(s.id);
                    return (
                      <Tr key={s.id} className={checked ? 'bg-brand/5' : undefined}>
                        <Td>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggle(s.id)}
                            aria-label={s.disease}
                            className="h-4 w-4 cursor-pointer accent-[rgb(var(--brand))]"
                          />
                        </Td>
                        <Td><span className="font-medium text-ink">{diseaseName(s)}</span></Td>
                        <Td className="whitespace-nowrap text-[12.5px]">{formatDate(s.timestamp, locale)}</Td>
                        <Td align="right">{(s.confidence * 100).toFixed(0)}%</Td>
                        <Td align="right"><RiskBadge level={s.riskLevel} size="sm" /></Td>
                        <Td align="right">
                          <button
                            onClick={() => {
                              try { generateReport(s); }
                              catch (err) { console.error('[AgroVision] PDF generation failed:', err); }
                            }}
                            aria-label={t('downloadReport')}
                            className="rounded-md p-1.5 text-ink-3 transition hover:bg-panel-2 hover:text-brand">
                            <FileDown size={15} />
                          </button>
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </DataTable>
            )}
          </Panel>
        </div>
      </div>
    </Page>
  );
}
