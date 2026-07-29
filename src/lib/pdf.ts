import type { jsPDF as JsPDFType } from 'jspdf';
import type { Scan } from './db';
import { kbByDisease, LABEL_NOTE, RESISTANCE_NOTE } from './disease-kb';
import { hasValidWeather } from './weather';

/**
 * Professional PDF scan report (web equivalent of utils/PdfReportGenerator.kt).
 *
 * Language note: jsPDF's built-in fonts are Latin-only and cannot render Tamil glyphs -
 * emitting Tamil through them produces blank or garbled text. This report is therefore
 * always generated in English, using the canonical disease name. That is also the useful
 * behaviour in practice: the report is the artefact shared with agronomists, buyers and
 * insurers. Embedding a Tamil font would be the fix if a Tamil report is ever needed.
 *
 * Throws on failure so the caller can surface an error instead of appearing to do nothing.
 */

const BRAND: [number, number, number] = [6, 132, 63];
const M = 48;                 // page margin
const PAGE_H = 842;           // A4 height in pt
const FOOTER_Y = PAGE_H - 30;
const BODY_LIMIT = FOOTER_Y - 40;

/** Reads the real image type out of a data URL; guessing "JPEG" breaks PNG screenshots. */
function imageFormat(dataUrl: string): 'JPEG' | 'PNG' | 'WEBP' | null {
  const m = /^data:image\/(jpeg|jpg|png|webp)/i.exec(dataUrl);
  if (!m) return null;
  const kind = m[1].toLowerCase();
  return kind === 'png' ? 'PNG' : kind === 'webp' ? 'WEBP' : 'JPEG';
}

export async function generateReport(scan: Scan): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
  const W = pdf.internal.pageSize.getWidth();

  pdf.setProperties({
    title: `AgroVision AI - ${scan.disease}`,
    subject: 'Tomato Leaf Disease Analysis Report',
    author: 'AgroVision AI',
    creator: 'AgroVision AI',
  });

  let y = 0;
  let page = 1;

  const footer = () => {
    pdf.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(150);
    pdf.text(
      'AgroVision AI provides decision support only. Diagnoses come from an image model and can be wrong. ' +
      'Confirm with a local agronomist before applying any chemical treatment, and follow the product label.',
      M, FOOTER_Y,
    );
    pdf.text(`Page ${page}`, W - M, FOOTER_Y, { align: 'right' });
  };

  const newPage = () => { footer(); pdf.addPage(); page += 1; y = 64; };
  const room = (needed: number) => { if (y + needed > BODY_LIMIT) newPage(); };

  // ---------------------------------------------------------------- header
  pdf.setFillColor(...BRAND);
  pdf.rect(0, 0, W, 92, 'F');
  pdf.setTextColor(255).setFont('helvetica', 'bold').setFontSize(21);
  pdf.text('AgroVision AI', M, 42);
  pdf.setFont('helvetica', 'normal').setFontSize(10.5);
  pdf.text('Tomato Leaf Disease Analysis Report', M, 62);

  const generated = new Date(scan.timestamp);
  pdf.setFontSize(9);
  pdf.text(generated.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
           W - M, 42, { align: 'right' });
  pdf.text(generated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
           W - M, 62, { align: 'right' });

  y = 124;

  // ------------------------------------------------- image + key findings
  const IMG = 150;
  let imgBottom = y;
  if (scan.imageDataUrl) {
    const fmt = imageFormat(scan.imageDataUrl);
    if (fmt) {
      try {
        pdf.addImage(scan.imageDataUrl, fmt, M, y, IMG, IMG);
        pdf.setDrawColor(220).rect(M, y, IMG, IMG);
        imgBottom = y + IMG;
      } catch {
        // A corrupt or oversized image must not sink the whole report.
        imgBottom = y;
      }
    }
  }

  const colX = M + IMG + 24;
  let ry = y + 4;

  pdf.setTextColor(20).setFont('helvetica', 'bold').setFontSize(17);
  pdf.text(pdf.splitTextToSize(scan.disease, W - colX - M) as string[], colX, ry);
  ry += 22;

  const sci = kbByDisease(scan.disease)?.scientific;
  if (sci) {
    pdf.setFont('helvetica', 'italic').setFontSize(10).setTextColor(120);
    pdf.text(sci, colX, ry);
    ry += 18;
  }

  const rows: [string, string][] = [
    ['Confidence', `${(scan.confidence * 100).toFixed(1)}%`],
    ['Severity', scan.severity],
    ['Risk level', scan.riskLevel],
    ['Disease Risk Index', `${scan.driScore.toFixed(1)} / 10`],
    ['Spread risk', `${scan.spreadRisk}%`],
  ];
  // Conditions only when the scan really captured them. This report is shared with
  // agronomists and buyers, so printing "0°C · 0% RH · Clear" is worse than printing
  // nothing - it is a fabricated field-condition record on a document people act on.
  if (hasValidWeather(scan)) {
    rows.push(['Conditions', `${Math.round(scan.temperature)}°C · ${scan.humidity}% RH · ${scan.weatherCondition}`]);
  }
  pdf.setFontSize(10);
  for (const [k, v] of rows) {
    pdf.setFont('helvetica', 'normal').setTextColor(120).text(k, colX, ry);
    pdf.setFont('helvetica', 'bold').setTextColor(20)
       .text(pdf.splitTextToSize(v, W - colX - M - 120) as string[], colX + 120, ry);
    ry += 16;
  }

  y = Math.max(imgBottom, ry) + 26;

  // --------------------------------------------------------- body sections
  const section = (title: string, items: string[]) => {
    const clean = items.map((s) => s.trim()).filter(Boolean);
    if (!clean.length) return;

    room(46);
    pdf.setTextColor(...BRAND).setFont('helvetica', 'bold').setFontSize(12).text(title, M, y);
    y += 6;
    pdf.setDrawColor(...BRAND).setLineWidth(0.8).line(M, y, W - M, y);
    y += 14;

    pdf.setFont('helvetica', 'normal').setFontSize(10.5).setTextColor(45);
    for (const item of clean) {
      const lines = pdf.splitTextToSize(item, W - M * 2 - 14) as string[];
      room(lines.length * 14 + 4);
      pdf.setTextColor(...BRAND).text('•', M, y);
      pdf.setTextColor(45).text(lines, M + 14, y);
      y += lines.length * 14 + 4;
    }
    y += 12;
  };

  const lines = (s: string) => (s ? s.split('\n') : []);
  const kb = kbByDisease(scan.disease);

  section('What to look for', kb?.symptoms ?? []);
  section('Treatment - chemical control', kb?.chemical ?? []);
  section('Treatment - organic / low-residue options', kb?.organic ?? []);
  section('Cultural control and prevention', kb?.cultural ?? []);

  // The scan's own stored advice, as a quick cross-check against the reference above.
  section('Quick reference - immediate steps', lines(scan.treatment));
  section('Quick reference - prevention', lines(scan.prevention));

  if (kb?.monitoring) section('Monitoring', [kb.monitoring]);
  if (kb?.conditions) {
    section('Conditions that favour it', [
      kb.conditions,
      ...(kb.spreads && kb.spreads !== 'n/a' ? [`How it spreads: ${kb.spreads}`] : []),
    ]);
  }
  section('Weather-based advisory', lines(scan.aiAdvisory));
  section('Recommended actions', lines(scan.recommendations));

  // Only relevant when a spray was actually recommended.
  if (kb && kb.chemical.length > 0 && kb.pathogen !== 'none') {
    section('Before you spray', [LABEL_NOTE, RESISTANCE_NOTE]);
  }

  footer();

  const stamp = generated.toISOString().slice(0, 10);
  const safe = scan.disease.replace(/[^\w]+/g, '_').replace(/^_|_$/g, '') || 'Scan';
  pdf.save(`AgroVision_${safe}_${stamp}.pdf`);
}
