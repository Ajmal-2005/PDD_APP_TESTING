'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, History as HistoryIcon, ScanLine, Trash2 } from 'lucide-react';
import { Page, PageHeader } from '@/components/shell/AppShell';
import {
  Button, DataTable, EmptyState, Panel, RiskBadge, ScanThumb, SearchInput, Select,
  Skeleton, SkeletonRows, Td, Th, Tr,
} from '@/components/ui';
import { useApp } from '@/providers/AppProvider';
import { useScans } from '@/lib/hooks';
import { deleteScan } from '@/lib/db';
import { unsyncScan } from '@/lib/sync';
import { generateReport } from '@/lib/pdf';
import { formatDate, cx } from '@/lib/utils';
import { useLabels, diseaseKey } from '@/lib/labels';
import type { StringKey } from '@/lib/i18n';

const RISK_FILTERS = ['ALL', 'HIGH', 'MEDIUM', 'LOW', 'SAFE'] as const;
const RISK_KEYS: Record<string, StringKey> = { HIGH: 'riskHigh', MEDIUM: 'riskMedium', LOW: 'riskLow', SAFE: 'riskSafe' };
type SortKey = 'newest' | 'oldest' | 'risk' | 'confidence';
const RISK_RANK: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1, SAFE: 0, UNKNOWN: 0 };

export default function HistoryPage() {
  const { t, locale } = useApp();
  const { diseaseName, severityName } = useLabels();
  const router = useRouter();
  const scans = useScans();

  const [query, setQuery] = useState('');
  const [risk, setRisk] = useState<(typeof RISK_FILTERS)[number]>('ALL');
  const [sort, setSort] = useState<SortKey>('newest');

  const rows = useMemo(() => {
    if (!scans) return [];
    const q = query.trim().toLowerCase();
    // Search the name actually on screen (current language) as well as the canonical
    // English label, so typing either finds the row.
    const filtered = scans.filter(
      (s) =>
        (risk === 'ALL' || s.riskLevel === risk) &&
        (!q ||
          s.disease.toLowerCase().includes(q) ||
          t(diseaseKey(s.disease)).toLowerCase().includes(q)),
    );
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sort === 'oldest') return a.timestamp - b.timestamp;
      if (sort === 'risk') return (RISK_RANK[b.riskLevel] - RISK_RANK[a.riskLevel]) || b.timestamp - a.timestamp;
      if (sort === 'confidence') return b.confidence - a.confidence;
      return b.timestamp - a.timestamp;
    });
    return sorted;
  }, [scans, query, risk, sort, t]);

  async function remove(id: string) {
    await deleteScan(id);
    void unsyncScan(id);
  }

  const active = query.trim() !== '' || risk !== 'ALL';

  return (
    <Page>
      <PageHeader
        title={t('navHistory')}
        subtitle={scans ? t('resultsCount', rows.length, scans.length) : undefined}
        actions={<Button variant="primary" href="/scan" icon={<ScanLine size={16} />}>{t('navScanCrops')}</Button>}
      />

      <Panel className="overflow-hidden">
        {/* toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 border-b border-line p-3.5">
          <div className="min-w-[12rem] flex-1">
            <SearchInput placeholder={t('searchDiagnoses')} value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Select value={risk} onChange={(e) => setRisk(e.target.value as typeof risk)} className="w-auto min-w-[8rem]">
            {RISK_FILTERS.map((f) => (
              <option key={f} value={f}>{f === 'ALL' ? t('filterAll') : t(RISK_KEYS[f])}</option>
            ))}
          </Select>
          <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="w-auto min-w-[10rem]">
            <option value="newest">{t('sortNewest')}</option>
            <option value="oldest">{t('sortOldest')}</option>
            <option value="risk">{t('sortRisk')}</option>
            <option value="confidence">{t('sortConfidence')}</option>
          </Select>
        </div>

        {scans === undefined ? (
          <SkeletonRows rows={7} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<HistoryIcon size={22} />}
            title={t('noScans')}
            hint={active ? t('noMatchHint') : t('scanInstruction')}
            action={!active ? <Button variant="primary" href="/scan" icon={<ScanLine size={15} />}>{t('navScanCrops')}</Button> : undefined}
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
                <Th align="right" width="5rem" />
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <Tr key={s.id} onClick={() => router.push(`/history/${s.id}`)}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <ScanThumb src={s.imageDataUrl} remoteSrc={s.imageUrl} className="h-10 w-10 shrink-0 rounded-lg border border-line object-cover" iconSize={16} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{diseaseName(s)}</p>
                        <p className="truncate text-[11.5px] text-ink-3">
                          {t('severity')}: {severityName(s.severity)}
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td className="whitespace-nowrap text-[12.5px]">{formatDate(s.timestamp, locale)}</Td>
                  <Td align="right">{(s.confidence * 100).toFixed(0)}%</Td>
                  <Td align="right" className="font-medium text-ink">{s.driScore.toFixed(1)}</Td>
                  <Td align="right"><RiskBadge level={s.riskLevel} size="sm" /></Td>
                  <Td align="right">
                    <div className="flex items-center justify-end gap-0.5 opacity-0 transition group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          try { generateReport(s); }
                          catch (err) { console.error('[AgroVision] PDF generation failed:', err); }
                        }}
                        aria-label={t('downloadReport')}
                        className="rounded-md p-1.5 text-ink-3 transition hover:bg-panel-2 hover:text-brand"
                      >
                        <Download size={15} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); remove(s.id); }}
                        aria-label={t('deleteAction')}
                        className="rounded-md p-1.5 text-ink-3 transition hover:bg-risk-high/10 hover:text-risk-high"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </Panel>
    </Page>
  );
}
