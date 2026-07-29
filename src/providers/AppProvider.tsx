'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { getAuthInstance, firebaseReady } from '@/lib/firebase';
import { dictionaries, format, type Locale, type StringKey } from '@/lib/i18n';

interface AppCtx {
  dark: boolean;
  toggleDark: () => void;
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: StringKey, ...args: (string | number)[]) => string;
  user: User | null;
  authLoading: boolean;
  firebaseReady: boolean;
  loginAsGuest: (name?: string, email?: string) => void;
  logoutGuest: () => void;
  logoutApp: () => Promise<void>;
}

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(true);
  const [locale, setLocaleState] = useState<Locale>('en');
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const d = localStorage.getItem('agrovision.dark');
    const l = localStorage.getItem('agrovision.locale') as Locale | null;
    const demoUserStr = localStorage.getItem('agrovision.demoUser');

    if (d !== null) setDark(d === 'true');
    if (l === 'en' || l === 'ta') setLocaleState(l);

    if (demoUserStr) {
      try {
        const parsed = JSON.parse(demoUserStr);
        setUser(parsed as User);
      } catch {
        localStorage.removeItem('agrovision.demoUser');
      }
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('agrovision.dark', String(dark));
  }, [dark]);

  useEffect(() => {
    document.documentElement.lang = locale;
    localStorage.setItem('agrovision.locale', locale);
  }, [locale]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    (async () => {
      const auth = await getAuthInstance();
      if (!auth) {
        setAuthLoading(false);
        return;
      }
      const { onAuthStateChanged } = await import('firebase/auth');
      unsubscribe = onAuthStateChanged(auth, (u) => {
        if (u) {
          setUser(u);
          localStorage.removeItem('agrovision.demoUser');
        } else {
          const demoUserStr = typeof window !== 'undefined' ? localStorage.getItem('agrovision.demoUser') : null;
          if (demoUserStr) {
            try {
              setUser(JSON.parse(demoUserStr));
            } catch {
              localStorage.removeItem('agrovision.demoUser');
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }
        setAuthLoading(false);
      });
    })();
    return () => unsubscribe?.();
  }, []);

  const loginAsGuest = useCallback((name?: string, email?: string) => {
    const demoUser = {
      uid: 'demo-farmer-' + Date.now().toString(36),
      displayName: name || 'Demo Farmer',
      email: email || 'farmer@agrovision.ai',
      emailVerified: true,
      isAnonymous: false,
    } as unknown as User;

    localStorage.setItem('agrovision.demoUser', JSON.stringify(demoUser));
    setUser(demoUser);
  }, []);

  const logoutGuest = useCallback(() => {
    localStorage.removeItem('agrovision.demoUser');
    setUser(null);
  }, []);

  const logoutApp = useCallback(async () => {
    localStorage.removeItem('agrovision.demoUser');
    setUser(null);
    const auth = await getAuthInstance();
    if (auth) {
      const { signOut } = await import('firebase/auth');
      await signOut(auth).catch((e) => console.warn('Signout error', e));
    }
  }, []);

  const t = useCallback(
    (key: StringKey, ...args: (string | number)[]) => {
      const s = dictionaries[locale][key] ?? dictionaries.en[key] ?? String(key);
      return args.length ? format(s, ...args) : s;
    },
    [locale],
  );

  const value = useMemo<AppCtx>(
    () => ({
      dark,
      toggleDark: () => setDark((v) => !v),
      locale,
      setLocale: setLocaleState,
      t,
      user,
      authLoading,
      firebaseReady,
      loginAsGuest,
      logoutGuest,
      logoutApp,
    }),
    [dark, locale, t, user, authLoading, loginAsGuest, logoutGuest, logoutApp],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp must be used inside AppProvider');
  return c;
}
