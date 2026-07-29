'use client';

import { DISEASE_I18N_KEY } from './diseases';
import { useApp } from '@/providers/AppProvider';
import type { StringKey } from './i18n';

/**
 * Centralized display names for scan data.
 *
 * A scan row stores `translatedDisease`, but that string is frozen in whatever language
 * was active when the scan ran. Rendering it directly means an account that switches
 * language ends up with a history list mixing English and Tamil. So every label is
 * derived at RENDER time from the canonical, language-independent fields
 * (`scan.disease`, `scan.severity`) - the stored translation is display-legacy only and
 * is deliberately never shown.
 */
export const diseaseKey = (disease: string): StringKey =>
  (DISEASE_I18N_KEY[disease] ?? 'diseaseUnknown') as StringKey;

const SEVERITY_KEY: Record<string, StringKey> = {
  High: 'severityHigh',
  Medium: 'severityMedium',
  Low: 'severityLow',
  None: 'severityNone',
  'N/A': 'severityNone',
};

export const severityKey = (severity: string): StringKey =>
  SEVERITY_KEY[severity] ?? 'severityNone';

const RISK_KEY: Record<string, StringKey> = {
  HIGH: 'riskHigh',
  MEDIUM: 'riskMedium',
  LOW: 'riskLow',
  SAFE: 'riskSafe',
  UNKNOWN: 'diseaseUnknown',
};

export const riskKey = (level: string): StringKey => RISK_KEY[level] ?? 'diseaseUnknown';

/** Hook form: `const { diseaseName } = useLabels()`. */
export function useLabels() {
  const { t } = useApp();
  const diseaseText = (disease: string) => t(diseaseKey(disease));
  return {
    diseaseName: (scan: { disease: string }) => diseaseText(scan.disease),
    /**
     * Canonical disease name -> display name, for series that come out of `computeStats`
     * rather than off a scan row. `stats.byDisease` keys on the raw `scan.disease` value,
     * so charts rendered straight from it showed English names beside a translated table.
     */
    diseaseText,
    /**
     * Translate the `label` of every item in a stats series.
     *
     * Apply this BEFORE `foldTail` - the "Other" bucket it appends is already translated,
     * and running it back through `diseaseKey` would collapse it to "Unknown".
     */
    diseaseSeries: <T extends { label: string }>(items: T[]): T[] =>
      items.map((i) => ({ ...i, label: diseaseText(i.label) })),
    severityName: (severity: string) => t(severityKey(severity)),
    riskName: (level: string) => t(riskKey(level)),
  };
}
