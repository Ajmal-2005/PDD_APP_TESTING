import type { Scan } from './db';

const esc = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const COLUMNS: { header: string; get: (s: Scan) => string | number }[] = [
  { header: 'Date', get: (s) => new Date(s.timestamp).toISOString() },
  { header: 'Disease', get: (s) => s.disease },
  { header: 'Confidence', get: (s) => (s.confidence * 100).toFixed(1) + '%' },
  { header: 'Severity', get: (s) => s.severity },
  { header: 'Risk Level', get: (s) => s.riskLevel },
  { header: 'DRI', get: (s) => s.driScore.toFixed(1) },
  { header: 'Spread Risk %', get: (s) => s.spreadRisk },
  { header: 'Temperature C', get: (s) => Math.round(s.temperature) },
  { header: 'Humidity %', get: (s) => s.humidity },
  { header: 'Conditions', get: (s) => s.weatherCondition },
];

/** Downloads the given scans as a CSV. Images are omitted — they don't belong in a spreadsheet. */
export function exportScansCsv(scans: Scan[], filename = 'agrovision-scans.csv') {
  const rows = [
    COLUMNS.map((c) => c.header).join(','),
    ...scans.map((s) => COLUMNS.map((c) => esc(c.get(s))).join(',')),
  ];
  const blob = new Blob(['﻿' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
