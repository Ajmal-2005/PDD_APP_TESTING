import { NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Server-side proxy for OpenWeather. The key stays in OPENWEATHER_API_KEY and never
 * reaches the browser bundle - unlike WeatherRepository.kt, which ships the key
 * inside the APK where anyone can decompile it out.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const key = process.env.OPENWEATHER_API_KEY;

  if (!key) return NextResponse.json({ error: 'OPENWEATHER_API_KEY not configured' }, { status: 500 });
  if (!lat || !lon) return NextResponse.json({ error: 'lat and lon are required' }, { status: 400 });

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric`;
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) return NextResponse.json({ error: `upstream ${res.status}` }, { status: res.status });
    return NextResponse.json(await res.json());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
