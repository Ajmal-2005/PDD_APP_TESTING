'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera, Check, Copy, Download, ImageUp, Minus, Plus, RotateCcw, ScanLine,
  ShieldCheck, Sparkles, TriangleAlert, X, XCircle, Pill, Activity, Zap, ListChecks,
} from 'lucide-react';
import { Page, PageHeader } from '@/components/shell/AppShell';
import {
  Badge, Button, EmptyState, Meter, Panel, PanelBody, PanelHeader,
  RadialGauge, RiskBadge, Spinner, riskColor,
} from '@/components/ui';
import { Dropzone } from '@/components/Dropzone';
import { useApp } from '@/providers/AppProvider';
import { useClassify } from '@/lib/use-classify';
import { generateReport } from '@/lib/pdf';
import {
  SCIENTIFIC_NAMES, TREATMENTS, PREVENTION, DISEASE_I18N_KEY, immediateAction,
} from '@/lib/diseases';
import { cx, toDataUrl } from '@/lib/utils';
import type { StringKey } from '@/lib/i18n';

export default function ScanWorkspace() {
  const { t } = useApp();
  const router = useRouter();
  const { modelState, analyzing, error, outcome, run, reset } = useClassify();

  const [image, setImage] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [camError, setCamError] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // An image handed over from the dashboard drop zone.
  useEffect(() => {
    const pending = sessionStorage.getItem('agrovision.pendingImage');
    if (pending) {
      sessionStorage.removeItem('agrovision.pendingImage');
      setImage(pending);
    }
  }, []);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    setCameraOn(false);
  };
  useEffect(() => stopCamera, []);

  async function startCamera() {
    setCamError('');
    reset();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
      setImage(null);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setCamError(t('cameraPermissionDesc'));
    }
  }

  function capture() {
    const v = videoRef.current;
    if (!v) return;
    setImage(toDataUrl(v, 1024));
    setZoom(1);
    stopCamera();
  }

  function accept(dataUrl: string) {
    reset();
    setZoom(1);
    setImage(dataUrl);
  }

  function clear() {
    setImage(null);
    setZoom(1);
    reset();
    stopCamera();
  }

  const busy = modelState === 'loading';

  return (
    <Page className="max-w-[100rem]">
      <PageHeader
        title={t('navScanCrops')}
        subtitle={t('scanWorkspaceSubtitle')}
        actions={
          image && !analyzing ? (
            <Button variant="ghost" icon={<RotateCcw size={15} />} onClick={clear}>{t('clearImage')}</Button>
          ) : undefined
        }
      />

      {modelState === 'missing' && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-risk-medium/40 bg-risk-medium/10 p-3.5">
          <TriangleAlert size={18} className="mt-0.5 shrink-0 text-risk-medium" />
          <div>
            <p className="text-[13.5px] font-semibold text-ink">{t('modelMissing')}</p>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-2">{t('modelMissingHint')}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-4 lg:gap-5">
        {/* ---- LEFT: source ---- */}
        <div className="col-span-12 space-y-4 lg:col-span-3">
          <Panel>
            <PanelHeader title={t('sourcePanel')} icon={<ImageUp size={16} />} />
            <PanelBody className="space-y-3">
              <Dropzone
                compact
                title={t('dropzoneTitle')}
                hint={t('dropzoneHint')}
                browseLabel={t('browseFiles')}
                onFile={(dataUrl) => accept(dataUrl)}
              />
              <Button
                variant={cameraOn ? 'danger' : 'secondary'}
                full
                icon={cameraOn ? <X size={15} /> : <Camera size={15} />}
                onClick={cameraOn ? stopCamera : startCamera}
              >
                {cameraOn ? t('stopCamera') : t('useCamera')}
              </Button>
              {camError && <p className="text-[12.5px] text-risk-high">{camError}</p>}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title={t('scanTips')} icon={<Sparkles size={16} />} />
            <PanelBody>
              <ul className="space-y-2.5">
                {(['scanTip1', 'scanTip2', 'scanTip3'] as StringKey[]).map((k) => (
                  <li key={k} className="flex gap-2.5 text-[12.5px] leading-relaxed text-ink-2">
                    <Check size={14} className="mt-0.5 shrink-0 text-brand" />
                    {t(k)}
                  </li>
                ))}
              </ul>
            </PanelBody>
          </Panel>
        </div>

        {/* ---- CENTER: preview ---- */}
        <div className="col-span-12 lg:col-span-5">
          <Panel className="flex h-full flex-col">
            <PanelHeader
              title={t('previewPanel')}
              icon={<ScanLine size={16} />}
              action={image && !cameraOn ? (
                <div className="flex items-center gap-1">
                  <button onClick={() => setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)))} aria-label={t('zoomLabel')}
                    className="rounded-md border border-line bg-panel p-1.5 text-ink-2 transition hover:bg-panel-2 disabled:opacity-40" disabled={zoom <= 1}>
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center text-[12px] tnum text-ink-3">{zoom.toFixed(2)}×</span>
                  <button onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))} aria-label={t('zoomLabel')}
                    className="rounded-md border border-line bg-panel p-1.5 text-ink-2 transition hover:bg-panel-2 disabled:opacity-40" disabled={zoom >= 3}>
                    <Plus size={14} />
                  </button>
                </div>
              ) : undefined}
            />
            <PanelBody className="flex flex-1 flex-col">
              <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-line bg-[repeating-conic-gradient(rgb(var(--panel-2))_0_25%,transparent_0_50%)] bg-[length:24px_24px]">
                {cameraOn ? (
                  <>
                    <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
                    <div className="pointer-events-none absolute inset-[12%] rounded-2xl border-2 border-white/70" />
                    <p className="absolute inset-x-0 bottom-3 text-center text-[12px] text-white/90 drop-shadow">{t('captureHint')}</p>
                  </>
                ) : image ? (
                  <div className="h-full w-full overflow-auto scroll-thin">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image}
                      alt={t('previewPanel')}
                      className="h-full w-full object-contain transition-transform duration-200"
                      style={{ transform: `scale(${zoom})` }}
                    />
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                    <ScanLine size={40} strokeWidth={1.4} className="text-ink-3" />
                    <p className="max-w-[16rem] text-[13px] text-ink-3">{t('scanPlaceholder')}</p>
                  </div>
                )}

                {analyzing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 backdrop-blur-sm text-white">
                    <div className="absolute inset-x-0 h-0.5 animate-scan-sweep bg-brand shadow-[0_0_14px_rgb(var(--brand))]" />
                    <Spinner size={30} />
                    <p className="font-semibold tracking-wide">{t('analyzing')}</p>
                    <p className="text-[12.5px] text-white/75">{t('detectingPatterns')}</p>
                  </div>
                )}
              </div>

              {error && <p className="mt-3 text-center text-[13px] text-risk-high">{error}</p>}

              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {cameraOn ? (
                  <Button variant="primary" full icon={<Camera size={16} />} onClick={capture} className="col-span-2">
                    {t('captureAction')}
                  </Button>
                ) : (
                  <>
                    <Button variant="secondary" icon={<RotateCcw size={15} />} onClick={clear} disabled={!image || analyzing}>
                      {t('retakeAction')}
                    </Button>
                    <Button
                      variant="primary"
                      icon={analyzing ? undefined : <ScanLine size={16} />}
                      loading={analyzing}
                      // Only runnable with a working model - otherwise the click fails
                      // with a raw runtime error the farmer cannot act on.
                      disabled={!image || modelState !== 'ready' || !!outcome}
                      onClick={() => image && run(image)}
                    >
                      {t('runAnalysis')}
                    </Button>
                  </>
                )}
              </div>
            </PanelBody>
          </Panel>
        </div>

        {/* ---- RIGHT: diagnosis ---- */}
        <div className="col-span-12 lg:col-span-4">
          <Panel className="h-full">
            <PanelHeader title={t('resultPanel')} icon={<Activity size={16} />} />
            {outcome?.result.invalid ? (
              <InvalidImageResult reason={outcome.result.invalidReason} />
            ) : outcome ? (
              <DiagnosisResult outcome={outcome} onOpenReport={() => router.push('/history')} />
            ) : (
              <EmptyState
                icon={busy ? <Spinner size={18} /> : <Activity size={20} />}
                title={t('awaitingScan')}
                hint={t('awaitingScanHint')}
              />
            )}
          </Panel>
        </div>
      </div>
    </Page>
  );
}

/**
 * Terminal error state for an image that is not a usable tomato leaf.
 *
 * Deliberately shows NO diagnosis, confidence, DRI, treatment or prevention - presenting
 * any of those would imply the model produced a real finding, which it did not. Nothing
 * is written to IndexedDB or Firestore, and no report can be generated.
 */
function InvalidImageResult({ reason }: { reason?: 'not_tomato' | 'low_confidence' }) {
  const { t } = useApp();
  return (
    <div className="flex flex-col items-center gap-4 px-5 py-10 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full border border-risk-high/30 bg-risk-high/10 text-risk-high">
        <XCircle size={30} strokeWidth={1.8} />
      </div>
      <div>
        <h3 className="text-[16px] font-semibold text-ink">{t('invalidImageTitle')}</h3>
        <p className="mt-1.5 max-w-[19rem] text-[13px] leading-relaxed text-ink-2">
          {reason === 'low_confidence' ? t('invalidLowConfidence') : t('invalidImageBody')}
        </p>
      </div>
      <p className="text-[12px] text-ink-3">{t('invalidNotSaved')}</p>

      <ul className="mt-1 w-full space-y-2 rounded-lg border border-line bg-panel-2/50 p-3 text-left">
        {(['scanTip1', 'scanTip2', 'scanTip3'] as StringKey[]).map((k) => (
          <li key={k} className="flex gap-2.5 text-[12.5px] leading-relaxed text-ink-2">
            <Check size={14} className="mt-0.5 shrink-0 text-ink-3" />
            {t(k)}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Right-panel result view for a freshly-run scan. */
function DiagnosisResult({ outcome, onOpenReport }: { outcome: ReturnType<typeof useClassify>['outcome'] & object; onOpenReport: () => void }) {
  const { t } = useApp();
  const [copied, setCopied] = useState(false);
  const [reportError, setReportError] = useState('');
  const { result, scan } = outcome!;

  async function downloadReport() {
    if (!scan) return;
    setReportError('');
    try {
      await generateReport(scan);
    } catch (e) {
      console.error('[AgroVision] PDF generation failed:', e);
      setReportError(t('reportFailed'));
    }
  }

  const color = riskColor(result.riskLevel);
  const i18nKey = (DISEASE_I18N_KEY[result.disease] ?? 'diseaseUnknown') as StringKey;
  const name = t(i18nKey);
  const treatments = TREATMENTS[result.disease] ?? [];
  const prevention = PREVENTION[result.disease] ?? [];

  // Top class scores, largest first, folded to the meaningful few.
  const scores = [...result.allScores].sort((a, b) => b.score - a.score).slice(0, 4);

  async function copySummary() {
    const text = [
      `AgroVision AI - ${name}`,
      SCIENTIFIC_NAMES[result.disease] && `(${SCIENTIFIC_NAMES[result.disease]})`,
      `Confidence: ${(result.confidence * 100).toFixed(1)}%`,
      `Risk: ${result.riskLevel} · DRI ${result.driScore.toFixed(1)}/10`,
      '',
      immediateAction(result.disease),
    ].filter(Boolean).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard blocked; ignore */ }
  }

  return (
    <div className="max-h-[calc(100vh-9rem)] space-y-4 overflow-y-auto scroll-thin p-5">
      <div className="flex flex-col items-center gap-3 text-center">
        <RadialGauge value={result.confidence} color={color} size={128}>
          <span className="text-[26px] font-semibold tnum text-ink">{(result.confidence * 100).toFixed(0)}%</span>
          <span className="text-[10.5px] uppercase tracking-wide text-ink-3">{t('confidence')}</span>
        </RadialGauge>
        <div>
          <h3 className="text-[17px] font-semibold text-ink">{name}</h3>
          {SCIENTIFIC_NAMES[result.disease] && (
            <p className="mt-0.5 text-[12.5px] italic text-ink-3">{SCIENTIFIC_NAMES[result.disease]}</p>
          )}
        </div>
        <RiskBadge level={result.riskLevel} />
      </div>

      <div className="grid grid-cols-3 gap-2 border-y border-line py-3 text-center">
        {[[t('severity'), result.severity], [t('driLabel'), `${result.driScore.toFixed(1)}`], [t('riskLevel'), result.riskLevel]].map(([k, v]) => (
          <div key={k}>
            <p className="text-[10.5px] uppercase tracking-wide text-ink-3">{k}</p>
            <p className="mt-0.5 text-[13px] font-semibold text-ink">{v}</p>
          </div>
        ))}
      </div>

      {/* immediate action */}
      <div className="flex gap-2.5 rounded-lg border p-3" style={{ borderColor: `color-mix(in srgb, ${color} 35%, transparent)`, background: `color-mix(in srgb, ${color} 8%, transparent)` }}>
        <Zap size={16} className="mt-0.5 shrink-0" style={{ color }} />
        <p className="text-[12.5px] leading-relaxed text-ink-2">{immediateAction(result.disease)}</p>
      </div>

      {/* class scores */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-ink-3">
          <ListChecks size={13} />{t('topPredictions')}
        </p>
        <div className="space-y-1.5">
          {scores.map((s, i) => (
            <Meter
              key={s.label}
              value={s.score * 100}
              color={i === 0 ? color : 'rgb(var(--ink-3))'}
              height={6}
              label={<span className="text-ink-2">{cleanLabel(s.label)}</span>}
              valueLabel={`${(s.score * 100).toFixed(0)}%`}
            />
          ))}
        </div>
      </div>

      {treatments.length > 0 && <BulletBlock icon={<Pill size={14} />} title={t('treatment')} items={treatments} />}
      {prevention.length > 0 && <BulletBlock icon={<ShieldCheck size={14} />} title={t('prevention')} items={prevention} />}

      <div className="flex flex-col gap-2 pt-1">
        {scan && (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" icon={copied ? <Check size={15} /> : <Copy size={15} />} onClick={copySummary}>
              {copied ? t('copiedToClipboard') : t('shareResult')}
            </Button>
            <Button variant="secondary" icon={<Download size={15} />} onClick={downloadReport}>
              PDF
            </Button>
          </div>
        )}
        {reportError && <p className="text-[12.5px] text-risk-high">{reportError}</p>}
        {scan && <Button variant="ghost" full onClick={onOpenReport}>{t('viewAll')}</Button>}
      </div>
    </div>
  );
}

function BulletBlock({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-ink">{icon}{title}</p>
      <ul className="space-y-1.5">
        {items.map((i) => (
          <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-ink-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" />{i}
          </li>
        ))}
      </ul>
    </div>
  );
}

const cleanLabel = (raw: string) =>
  raw.replace('Tomato___', '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
