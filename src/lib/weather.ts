export interface Weather {
  main: { temp: number; feels_like: number; temp_min: number; temp_max: number; humidity: number; pressure: number };
  weather: { main: string; description: string; icon: string }[];
  wind: { speed: number };
  name: string;
}

export async function fetchWeather(lat: number, lon: number): Promise<Weather> {
  const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `weather ${res.status}`);
  return res.json();
}

/**
 * Did this scan actually capture a weather reading?
 *
 * Scans taken with geolocation denied, offline, or before the weather call resolved were
 * stored as 0 C / 0 % / "Clear" - a fabricated reading indistinguishable from a real one,
 * which is why history showed a confident 0 C. Newer scans record an empty condition
 * instead, but older rows and anything synced from Android still carry the old defaults,
 * so the check has to catch both.
 *
 * Deliberately strict: a missing weather card is better than a wrong one, and every
 * rejected case here is genuinely unusable data rather than an unusual reading.
 *
 *  - humidity 0 % is not physically meaningful at ground level; the API never returns it
 *  - an empty condition means the write path had nothing to store
 *  - the temperature range is far wider than anywhere tomatoes grow, so it only rejects
 *    corrupt values, never a real one
 */
export function hasValidWeather(scan: {
  temperature: number; humidity: number; weatherCondition: string;
}): boolean {
  const { temperature, humidity, weatherCondition } = scan;
  if (!weatherCondition || !weatherCondition.trim()) return false;
  if (!Number.isFinite(humidity) || humidity <= 0 || humidity > 100) return false;
  if (!Number.isFinite(temperature) || temperature < -60 || temperature > 70) return false;
  // The exact 0/0 pair the old fallback wrote. A real reading never pairs them.
  if (temperature === 0 && humidity === 0) return false;
  return true;
}

export function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation unsupported'));
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, maximumAge: 600000 });
  });
}
