'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { Spinner } from './ui';

/** Client-side route guard. Equivalent to the login checks in SplashScreen.kt. */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, authLoading, firebaseReady } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && firebaseReady && !user) router.replace('/login');
  }, [user, authLoading, firebaseReady, router]);

  // Resolving the session, or bouncing an unauthenticated visitor to /login:
  // hold a spinner rather than flashing the protected UI or a blank frame.
  if (authLoading || (firebaseReady && !user)) {
    return (
      <div className="flex min-h-screen items-center justify-center text-brand">
        <Spinner size={28} />
      </div>
    );
  }
  // With Firebase unconfigured the app still runs, storing scans locally only.
  return <>{children}</>;
}
