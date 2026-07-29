import Dexie, { type Table } from 'dexie';

/**
 * Mirrors ScanEntity from the Android Room database, field for field, so the
 * same documents round-trip through the shared Firestore collection.
 * imagePath (a filesystem path on Android) becomes imageDataUrl on web.
 */
export interface Scan {
  id: string;
  userId: string;
  disease: string;
  translatedDisease: string;
  confidence: number;
  severity: string;
  driScore: number;
  riskLevel: string;
  treatment: string;
  prevention: string;
  aiAdvisory: string;
  /** Base64 copy held on THIS device. Empty for scans synced from another device. */
  imageDataUrl: string;
  /**
   * Firebase Storage download URL for the same picture, shared with Android via the
   * `imageUrl` field on the scan document. Empty when the upload has not finished, or
   * when the scan predates image sync - callers fall back to imageDataUrl, then to a
   * placeholder, so an empty value is always safe.
   */
  imageUrl: string;
  /**
   * A small JPEG data URL (~480px) carried INSIDE the Firestore document.
   *
   * This is how images cross between devices without Cloud Storage, which Firebase now
   * puts behind the paid Blaze plan. A document caps at 1 MB; a 480px thumbnail is around
   * 20-50 KB, so it fits with room to spare while the full-resolution copy stays on the
   * device that captured it.
   */
  imageThumb: string;
  timestamp: number;
  languageUsed: string;
  weatherCondition: string;
  temperature: number;
  humidity: number;
  spreadRisk: number;
  recommendations: string;
}

class AgroVisionDB extends Dexie {
  scans!: Table<Scan, string>;
  constructor() {
    super('agrovision_db');
    this.version(1).stores({ scans: 'id, userId, timestamp, disease, riskLevel' });
  }
}

export const db = new AgroVisionDB();

export const scanById = (id: string) => db.scans.get(id);
export const deleteScan = (id: string) => db.scans.delete(id);
export const saveScan = (s: Scan) => db.scans.put(s);

/*
 * ---------------------------------------------------------------------------
 * Untrusted-record handling
 *
 * Rows do not only come from this device. subscribeToScans() mirrors documents
 * written by other clients - a different Android build, an older schema, the
 * diagnostic script - and those cannot be assumed to carry every field. A missing
 * number used to reach the UI as `undefined` and take the page down on `.toFixed()`.
 *
 * So the Scan contract is enforced once, here at the boundary, rather than with a
 * defensive `?? 0` at each of the dozen places that render one.
 * ---------------------------------------------------------------------------
 */

const NUMERIC_FIELDS = ['confidence', 'driScore', 'timestamp', 'temperature', 'humidity', 'spreadRisk'] as const;
const TEXT_FIELDS = [
  'disease', 'translatedDisease', 'severity', 'riskLevel', 'treatment',
  'prevention', 'aiAdvisory', 'languageUsed', 'weatherCondition', 'recommendations',
  // Rows written before image sync existed have no imageUrl at all. Listing it here
  // makes healLocalScans() backfill them with '' rather than leaving undefined to reach
  // an <img src>, which renders a broken-image icon.
  'imageUrl', 'imageThumb',
] as const;

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const str = (v: unknown): string => (typeof v === 'string' ? v : '');

/** True when every field the UI reads is present and of the right type. */
export function isCompleteScan(s: Partial<Scan>): boolean {
  return NUMERIC_FIELDS.every((k) => Number.isFinite(s[k]))
    && TEXT_FIELDS.every((k) => typeof s[k] === 'string');
}

/**
 * Coerce an arbitrary record into a complete Scan. A partial document degrades to
 * zeros and empty strings - visibly incomplete, but never a crash.
 *
 * `imageDataUrl` is passed in rather than read from `raw` because cloud copies never
 * carry the image; the caller supplies whatever this device already holds.
 */
export function normalizeScan(
  raw: Record<string, unknown>,
  id: string,
  userId: string,
  imageDataUrl: string,
): Scan {
  return {
    id,
    userId,
    disease: str(raw.disease) || 'Unknown',
    translatedDisease: str(raw.translatedDisease),
    confidence: num(raw.confidence),
    severity: str(raw.severity) || 'None',
    driScore: num(raw.driScore),
    riskLevel: str(raw.riskLevel) || 'UNKNOWN',
    treatment: str(raw.treatment),
    prevention: str(raw.prevention),
    aiAdvisory: str(raw.aiAdvisory),
    imageDataUrl,
    imageUrl: str(raw.imageUrl),
    imageThumb: str(raw.imageThumb),
    timestamp: num(raw.timestamp) || Date.now(),
    languageUsed: str(raw.languageUsed) || 'en',
    weatherCondition: str(raw.weatherCondition),
    temperature: num(raw.temperature),
    humidity: num(raw.humidity),
    spreadRisk: num(raw.spreadRisk),
    recommendations: str(raw.recommendations),
  };
}
