export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export function greetingKey(d = new Date()): 'greetingMorning' | 'greetingAfternoon' | 'greetingEvening' {
  const h = d.getHours();
  return h < 12 ? 'greetingMorning' : h < 17 ? 'greetingAfternoon' : 'greetingEvening';
}

export const formatDate = (ts: number, locale: string) =>
  new Date(ts).toLocaleString(locale === 'ta' ? 'ta-IN' : 'en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

/** Consecutive days ending today that have at least one scan. Ported from ProfileScreen. */
export function scanStreak(timestamps: number[]): number {
  if (!timestamps.length) return 0;
  const days = new Set(timestamps.map((t) => new Date(t).toDateString()));
  let streak = 0;
  const cursor = new Date();
  if (!days.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
  while (days.has(cursor.toDateString())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Downscales a source image to a JPEG data URL for local storage. */
export function toDataUrl(source: CanvasImageSource, maxDim = 640, quality = 0.85): string {
  const w = (source as HTMLImageElement).naturalWidth ?? (source as HTMLVideoElement).videoWidth ?? 0;
  const h = (source as HTMLImageElement).naturalHeight ?? (source as HTMLVideoElement).videoHeight ?? 0;
  const scale = Math.min(1, maxDim / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext('2d')!.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}

export const uuid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
