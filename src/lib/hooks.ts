'use client';

import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, isCompleteScan, normalizeScan, type Scan } from './db';
import { fetchWeather, getPosition, type Weather } from './weather';
import { claimAnonymousScans, healLocalScans, subscribeToScans } from './sync';
import { useApp } from '@/providers/AppProvider';
import type { StringKey } from './i18n';

/**
 * IndexedDB is per-browser, not per-account, so every query must filter on userId.
 * Without it two farmers sharing one phone see each other's scan history.
 * 'anonymous' matches what ScanScreen writes when Firebase is not configured.
 */
export function useCurrentUserId(): string {
  const { user } = useApp();
  return user?.uid ?? 'anonymous';
}

/**
 * Last line of defence for malformed rows.
 *
 * healLocalScans() repairs the store, but it is async — without this a component could
 * render a bad row in the window before the repair lands and die on `.toFixed()`.
 * Complete rows are returned by identity, so downstream memoization is undisturbed.
 */
const ensure = (s: Scan): Scan =>
  isCompleteScan(s)
    ? s
    : normalizeScan(s as unknown as Record<string, unknown>, s.id, s.userId, s.imageDataUrl ?? '');

export function useScans(): Scan[] | undefined {
  const uid = useCurrentUserId();
  return useLiveQuery(
    async () => (await db.scans.where('userId').equals(uid).sortBy('timestamp')).reverse().map(ensure),
    [uid],
  );
}

/**
 * Keeps local IndexedDB in sync with the user's Firestore scans for the lifetime
 * of the session. Mount once, high in the authenticated tree. No-op when Firebase
 * is unconfigured or nobody is signed in (offline-only mode).
 */
export function useScanSync(): void {
  const { user, firebaseReady } = useApp();
  useEffect(() => {
    if (!firebaseReady || !user) return;
    // Adopt scans taken before sign-in and repair anything an earlier build stored
    // malformed, then start mirroring the cloud. Ordering matters: claiming re-tags
    // 'anonymous' rows to this uid, so healing afterwards covers them too.
    void (async () => {
      await claimAnonymousScans(user.uid);
      await healLocalScans(user.uid);
    })();
    return subscribeToScans(user.uid);
  }, [user, firebaseReady]);
}

export function useScan(id: string | undefined): Scan | undefined | null {
  const uid = useCurrentUserId();
  return useLiveQuery(async () => {
    if (!id) return null;
    const scan = await db.scans.get(id);
    return scan && scan.userId === uid ? ensure(scan) : null;
  }, [id, uid]);
}

export function useWeather() {
  const [weather, setWeather] = useState<Weather | null>(null);
  // A translation key, not a raw message: the browser's own strings ("User denied
  // Geolocation", "upstream 401") are English-only and mean nothing to a farmer.
  const [errorKey, setErrorKey] = useState<StringKey | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pos = await getPosition();
        const w = await fetchWeather(pos.coords.latitude, pos.coords.longitude);
        if (!cancelled) setWeather(w);
      } catch (e) {
        console.warn('Weather unavailable:', e);
        const denied = typeof GeolocationPositionError !== 'undefined' && e instanceof GeolocationPositionError;
        if (!cancelled) setErrorKey(denied ? 'locationDenied' : 'weatherUnavailable');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { weather, errorKey, loading };
}

/** Farm details, the web equivalent of UserDataStore (DataStore preferences). */
export interface FarmDetails { farmName: string; farmLocation: string; farmType: string }

export function useFarmDetails(): [FarmDetails, (d: FarmDetails) => void] {
  const [details, setDetails] = useState<FarmDetails>({ farmName: '', farmLocation: '', farmType: '' });

  useEffect(() => {
    const raw = localStorage.getItem('agrovision.farm');
    if (raw) { try { setDetails(JSON.parse(raw)); } catch {} }
  }, []);

  const save = (d: FarmDetails) => {
    setDetails(d);
    localStorage.setItem('agrovision.farm', JSON.stringify(d));
  };
  return [details, save];
}
