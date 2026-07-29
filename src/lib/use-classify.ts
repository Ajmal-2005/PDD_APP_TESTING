'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { classify, loadModel, type ClassificationResult } from './classifier';
import { computeForecast } from './forecast';
import { saveScan, type Scan } from './db';
import { syncScan } from './sync';
import { TREATMENTS, PREVENTION, DISEASE_I18N_KEY } from './diseases';
import { toDataUrl, uuid } from './utils';
import { useApp } from '@/providers/AppProvider';
import { useScans, useWeather } from './hooks';
import type { StringKey } from './i18n';

export type ModelState = 'loading' | 'ready' | 'missing';

export interface ScanOutcome { result: ClassificationResult; scan: Scan | null; thumb: string }

/**
 * Owns the whole run-a-scan flow: model lifecycle, inference, persistence and
 * best-effort cloud sync. Extracted from the old ScanScreen so the scan
 * workspace and the dashboard drop zone share one implementation.
 */
export function useClassify() {
  const { t, locale, user } = useApp();
  const scans = useScans();
  const { weather } = useWeather();

  const [modelState, setModelState] = useState<ModelState>('loading');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null);

  // Keep latest scans/weather without re-creating `run` on every store tick.
  const ctx = useRef({ scans, weather });
  ctx.current = { scans, weather };

  /**
   * Resolve the model up front instead of discovering it is missing only after the
   * farmer has picked an image, clicked Analyse and watched the scanning overlay run.
   * A file-existence check is not enough here: the .tflite case fails at runtime
   * initialization with the files present, so only a real load tells the truth.
   *
   * `loadModel()` caches its promise, so StrictMode's double-invoke costs nothing and
   * the graph is warm by the time Analyse is pressed.
   */
  useEffect(() => {
    let cancelled = false;
    loadModel().then(
      () => { if (!cancelled) setModelState('ready'); },
      (e) => {
        if (cancelled) return;
        console.error('[AgroVision] Model unavailable:', e);
        setModelState('missing');
      },
    );
    return () => { cancelled = true; };
  }, []);

  const run = useCallback(async (dataUrl: string) => {
    setAnalyzing(true);
    setError('');
    try {
      const img = new Image();
      img.src = dataUrl;
      await img.decode();

      const result = await classify(img);
      const thumb = toDataUrl(img, 720);

      let scan: Scan | null = null;
      // An invalid image (not a tomato leaf, or too uncertain to act on) is a terminal
      // error state: never written to IndexedDB, never synced to Firestore, no report.
      if (!result.invalid) {
        const { weather: w, scans: recent } = ctx.current;
        const forecast = computeForecast(w, recent?.[0] ?? null, recent?.slice(0, 5) ?? []);
        const key = DISEASE_I18N_KEY[result.disease] ?? DISEASE_I18N_KEY[result.rawLabel] ?? 'diseaseUnknown';

        scan = {
          id: uuid(),
          userId: user?.uid ?? 'anonymous',
          disease: result.disease,
          translatedDisease: t(key as StringKey),
          confidence: result.confidence,
          severity: result.severity,
          driScore: result.driScore,
          riskLevel: result.riskLevel,
          treatment: (TREATMENTS[result.disease] ?? []).join('\n'),
          prevention: (PREVENTION[result.disease] ?? []).join('\n'),
          aiAdvisory: t(forecast.advisoryKey),
          imageDataUrl: thumb,
          // Filled in by syncScan() once the upload to Firebase Storage completes.
          imageUrl: '',
          timestamp: Date.now(),
          languageUsed: locale,
          // Empty, not 'Clear'. The old default fabricated a plausible reading that was
          // indistinguishable from a real one, so history rendered a confident 0 C / 0 %
          // / Clear card for scans that never had weather at all. An empty condition is
          // what hasValidWeather() keys on to hide the card instead.
          weatherCondition: w?.weather?.[0]?.main ?? '',
          temperature: w?.main.temp ?? 0,
          humidity: w?.main.humidity ?? 0,
          spreadRisk: forecast.riskPercentage,
          recommendations: forecast.recommendationKeys.map((k) => t(k as StringKey)).join('\n'),
        };
        await saveScan(scan);
        void syncScan(scan);
      }

      setOutcome({ result, scan, thumb });
    } catch (e) {
      // Raw runtime strings ("INVALID_ARGUMENT: Can't initialize model") mean nothing to
      // a farmer; the model-missing banner already explains the real situation.
      const raw = (e as Error).message ?? '';
      const modelProblem = /initialize model|INVALID_ARGUMENT|No model found|TFLite|labels/i.test(raw);
      if (modelProblem) setModelState('missing');
      setError(modelProblem ? '' : raw || 'Classification failed');
      console.error('[AgroVision] Classification failed:', e);
    } finally {
      setAnalyzing(false);
    }
  }, [t, locale, user]);

  const reset = useCallback(() => { setOutcome(null); setError(''); }, []);

  return { modelState, analyzing, error, outcome, run, reset };
}
