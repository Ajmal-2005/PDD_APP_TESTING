'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/shell/Logo';
import { useApp } from '@/providers/AppProvider';

export default function SplashScreen() {
  const router = useRouter();
  const { t, user, authLoading, firebaseReady } = useApp();

  useEffect(() => {
    // Pre-warm the dashboard route while the splash animation plays.
    router.prefetch('/dashboard');
    router.prefetch('/login');
  }, [router]);

  useEffect(() => {
    if (authLoading) return;
    /*
     * Route as soon as auth resolves.
     *
     * This used to sit behind an unconditional 500 ms setTimeout whose comment claimed the
     * delay was skipped when auth resolved quickly — it never was, so every single entry
     * into the app paid it. Resolving auth already takes long enough for the splash to be
     * seen; padding it is half a second charged to every launch for nothing.
     */
    if (user || !firebaseReady) return router.replace('/dashboard');
    if (!localStorage.getItem('agrovision.onboarded')) return router.replace('/language');
    router.replace('/login');
  }, [user, authLoading, firebaseReady, router]);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden bg-gradient-to-br from-brand to-brand-hover text-white">
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-black/10 blur-3xl" />

      <div className="relative animate-pop">
        <Logo size={72} className="bg-white/15 backdrop-blur-xl" />
      </div>
      <div className="relative animate-rise text-center">
        <h1 className="text-[30px] font-semibold tracking-[-0.02em]">AgroVision AI</h1>
        <p className="mt-1.5 text-[13.5px] text-white/80">{t('splashTagline')}</p>
      </div>
      <div className="absolute bottom-14 h-1 w-36 overflow-hidden rounded-full bg-white/20">
        <div className="h-full w-1/3 animate-indeterminate rounded-full bg-white" />
      </div>
    </main>
  );
}
