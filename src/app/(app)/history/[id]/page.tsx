'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Activity, ArrowLeft, BookOpen, CloudSun, Download, Droplets, Pill, ShieldCheck,
  Thermometer, Trash2,
} from 'lucide-react';
import { Page } from '@/components/shell/AppShell';
import {
  Button, EmptyState, Meter, Modal, Panel, PanelBody, PanelHeader, RadialGauge,
  RiskBadge, ScanThumb, Skeleton, riskColor,
} from '@/components/ui';
import { useApp } from '@/providers/AppProvider';
import { useScan } from '@/lib/hooks';
import { deleteScan } from '@/lib/db';
import { unsyncScan } from '@/lib/sync';
import { generateReport } from '@/lib/pdf';
import { SCIENTIFIC_NAMES } from '@/lib/diseases';
import { kbByDisease } from '@/lib/disease-kb';
import { useLabels } from '@/lib/labels';
import { hasValidWeather } from '@/lib/weather';
import { formatDate } from '@/lib/utils';

export default function ScanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useApp();
  const { diseaseName } = useLabels();
  const router = useRouter();
  const scan = useScan(id);
  const [confirm, setConfirm] = useState(false);
  const [reportError, setReportError] = useState('');

  function downloadReport() {
    if (!scan) return;
    setReportError('');
    try {
      generateReport(scan);
    } catch (e) {
      console.error('[AgroVision] PDF generation failed:', e);
      setReportError(t('reportFailed'));
    }
  }

  if (scan === undefined) {
    return <Page><div className="grid gap-4 lg:grid-cols-3"><Skeleton className="h-96 lg:col-span-1" /><Skeleton className="h-96 lg:col-span-2" /></div></Page>;
  }
  if (scan === null) {
    return (
      <Page>
        <EmptyState
          icon={<Activity size={22} />}
          title={t('scanMissing')}
          action={<Button variant="secondary" href="/history" icon={<ArrowLeft size={15} />}>{t('navHistory')}</Button>}
        />
      </Page>
    );
  }

  const color = riskColor(scan.riskLevel);
  const kb = kbByDisease(scan.disease);
  const lines = (s: string) => s.split('\n').filter(Boolean);

  async function remove() {
    await deleteScan(scan!.id);
    void unsyncScan(scan!.id);
    router.replace('/history');
  }

  return (
    <Page>
      {/* breadcrumb / actions */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[13px] text-ink-3">
          <Link href="/history" className="rounded-md p-1 transition hover:text-ink"><ArrowLeft size={16} /></Link>
          <Link href="/history" className="transition hover:text-ink">{t('navHistory')}</Link>
          <span>/</span>
          <span className="truncate font-medium text-ink">{diseaseName(scan)}</span>
        </div>
        <div className="flex items-center gap-2">
          {kb && <Button variant="ghost" href={`/library?d=${kb.id}`} icon={<BookOpen size={15} />}>{t('navLibrary')}</Button>}
          <Button variant="secondary" icon={<Download size={15} />} onClick={downloadReport}>{t('downloadReport')}</Button>
          <Button variant="ghost" icon={<Trash2 size={15} />} onClick={() => setConfirm(true)} className="text-risk-high hover:bg-risk-high/10" />
        </div>
      </div>

      {reportError && (
        <p className="mb-4 rounded-lg border border-risk-high/30 bg-risk-high/10 p-3 text-[13px] text-risk-high">
          {reportError}
        </p>
      )}

      <div className="grid grid-cols-12 gap-4 lg:gap-5">
        {/* ---- LEFT: summary + image ---- */}
        <div className="col-span-12 space-y-4 lg:col-span-4">
          <Panel>
            <PanelBody className="flex flex-col items-center gap-3 text-center">
              <ScanThumb src={scan.imageDataUrl} remoteSrc={scan.imageThumb || scan.imageUrl} className="aspect-square w-full rounded-xl border border-line object-cover" iconSize={44} />
              <div>
                <h1 className="text-title text-ink">{diseaseName(scan)}</h1>
                {SCIENTIFIC_NAMES[scan.disease] && (
                  <p className="mt-0.5 text-[12.5px] italic text-ink-3">{SCIENTIFIC_NAMES[scan.disease]}</p>
                )}
              </div>
              <RiskBadge level={scan.riskLevel} />
              <p className="text-[12px] text-ink-3">{formatDate(scan.timestamp, locale)}</p>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelBody className="flex items-center gap-5">
              <RadialGauge value={scan.confidence} color={color} size={104} stroke={9}>
                <span className="text-[19px] font-semibold tnum text-ink">{(scan.confidence * 100).toFixed(0)}%</span>
                <span className="text-[10px] uppercase text-ink-3">{t('confidence')}</span>
              </RadialGauge>
              <div className="flex-1 space-y-3">
                <Meter value={scan.driScore * 10} color={color}
                  label={<span className="inline-flex items-center gap-1.5"><Activity size={13} />{t('driLabel')}</span>}
                  valueLabel={`${scan.driScore.toFixed(1)} / 10`} />
                <Meter value={scan.spreadRisk} color={color} label={t('spreadRisk')} valueLabel={`${scan.spreadRisk}%`} />
              </div>
            </PanelBody>
          </Panel>

          {/*
            Rendered only when the scan genuinely captured weather. Scans taken offline or
            with location denied stored 0 C / 0 % / "Clear", which read as a real forecast.
            An absent card is honest; a fabricated one is not.
          */}
          {hasValidWeather(scan) && (
            <Panel>
              <PanelHeader title={t('weatherSnapshot')} icon={<CloudSun size={16} />} />
              <PanelBody>
                <dl className="grid grid-cols-3 gap-2.5 text-center">
                  {[
                    { icon: <Thermometer size={15} />, label: t('tempLabel'), value: `${Math.round(scan.temperature)}°C` },
                    { icon: <Droplets size={15} />, label: t('humidity'), value: `${scan.humidity}%` },
                    { icon: <CloudSun size={15} />, label: t('skyLabel'), value: scan.weatherCondition },
                  ].map((x) => (
                    <div key={x.label} className="rounded-lg border border-line bg-panel-2/60 px-2 py-2.5">
                      <dt className="flex justify-center text-brand">{x.icon}</dt>
                      <dd className="mt-1 text-[11px] text-ink-3">{x.label}</dd>
                      <dd className="text-[13px] font-semibold text-ink">{x.value}</dd>
                    </div>
                  ))}
                </dl>
              </PanelBody>
            </Panel>
          )}
        </div>

        {/* ---- RIGHT: advice ---- */}
        <div className="col-span-12 space-y-4 lg:col-span-8">
          {scan.aiAdvisory && (
            <Panel>
              <PanelBody className="flex gap-3">
                <Activity size={17} className="mt-0.5 shrink-0 text-brand" />
                <p className="text-[13.5px] leading-relaxed text-ink-2">{scan.aiAdvisory}</p>
              </PanelBody>
            </Panel>
          )}

          <div className="grid gap-4 lg:gap-5 md:grid-cols-2">
            {scan.treatment && (
              <AdvicePanel icon={<Pill size={16} />} title={t('treatment')} items={lines(scan.treatment)} />
            )}
            {scan.prevention && (
              <AdvicePanel icon={<ShieldCheck size={16} />} title={t('prevention')} items={lines(scan.prevention)} />
            )}
          </div>

          {scan.recommendations && (
            <AdvicePanel icon={<Activity size={16} />} title={t('recommended')} items={lines(scan.recommendations)} />
          )}

          {kb && (
            <Panel>
              <PanelHeader title={t('symptomsLabel')} icon={<BookOpen size={16} />}
                action={<Button variant="ghost" size="sm" href={`/library?d=${kb.id}`}>{t('viewDetails')}</Button>} />
              <PanelBody>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {kb.symptoms.map((s) => (
                    <li key={s} className="flex gap-2 text-[13px] leading-relaxed text-ink-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-3" />{s}
                    </li>
                  ))}
                </ul>
              </PanelBody>
            </Panel>
          )}
        </div>
      </div>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title={t('clearConfirmTitle')}
        description={t('scanMissing')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(false)}>{t('cancel')}</Button>
            <Button variant="danger" icon={<Trash2 size={15} />} onClick={remove}>{t('deleteAction')}</Button>
          </>
        }
      >
        <p className="text-[13.5px] leading-relaxed text-ink-2">{t('clearConfirmBody')}</p>
      </Modal>
    </Page>
  );
}

function AdvicePanel({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <Panel>
      <PanelHeader title={title} icon={icon} />
      <PanelBody>
        <ul className="space-y-2.5">
          {items.map((i) => (
            <li key={i} className="flex gap-2.5 text-[13.5px] leading-relaxed text-ink-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />{i}
            </li>
          ))}
        </ul>
      </PanelBody>
    </Panel>
  );
}
