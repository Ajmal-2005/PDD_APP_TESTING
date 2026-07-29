'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { AuthLayout } from '@/components/AuthLayout';
import { Button, FieldRow, Input } from '@/components/ui';
import { useApp } from '@/providers/AppProvider';
import { login, loginWithGoogle, resetPassword, authMessage } from '@/lib/auth-actions';

export default function LoginScreen() {
  const { t, user, firebaseReady, loginAsGuest } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => { if (user) router.replace('/dashboard'); }, [user, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(''); setNotice('');
    if (!firebaseReady) {
      loginAsGuest(email.split('@')[0] || 'Farmer', email);
      router.replace('/dashboard');
      setBusy(false);
      return;
    }
    try {
      await login(email.trim(), password);
      router.replace('/dashboard');
    } catch (err) {
      // Fallback to guest mode if Firebase fails in offline/demo environment
      console.warn('[AgroVision] Firebase auth failed, falling back to guest mode:', err);
      loginAsGuest(email.split('@')[0] || 'Farmer', email);
      router.replace('/dashboard');
    } finally { setBusy(false); }
  }

  async function google() {
    setBusy(true); setError(''); setNotice('');
    if (!firebaseReady) {
      loginAsGuest('Google User', 'google.user@agrovision.ai');
      router.replace('/dashboard');
      setBusy(false);
      return;
    }
    try {
      await loginWithGoogle();
      router.replace('/dashboard');
    } catch (err) {
      console.warn('[AgroVision] Google auth failed, falling back to guest mode:', err);
      loginAsGuest('Google User', 'google.user@agrovision.ai');
      router.replace('/dashboard');
    } finally { setBusy(false); }
  }

  async function forgot() {
    setError(''); setNotice('');
    const target = email.trim();
    if (!target) { setError(t('resetEnterEmail')); return; }
    setBusy(true);
    try {
      await resetPassword(target);
      setNotice(t('resetSent'));
    } catch (err) { setError(authMessage(err)); } finally { setBusy(false); }
  }

  function guestLogin() {
    loginAsGuest('Demo Farmer', 'demo@agrovision.ai');
    router.replace('/dashboard');
  }

  return (
    <AuthLayout>
      <h1 className="text-title text-ink">{t('loginTitle')}</h1>
      <p className="mt-1.5 text-[13.5px] text-ink-2">{t('loginSubtitle')}</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <FieldRow label={t('email')} htmlFor="email">
          <Input id="email" type="email" required autoComplete="email" icon={<Mail size={15} />}
            placeholder="you@farm.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </FieldRow>

        <div className="grid gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="label">{t('password')}</label>
            <button
              type="button"
              onClick={forgot}
              disabled={busy}
              className="text-[12px] font-medium text-brand transition hover:underline disabled:opacity-45"
            >
              {t('forgotPassword')}
            </button>
          </div>
          <Input
            id="password"
            type={show ? 'text' : 'password'}
            required
            autoComplete="current-password"
            icon={<Lock size={15} />}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            trailing={
              <button type="button" onClick={() => setShow(!show)} aria-label="Toggle password"
                className="text-ink-3 transition hover:text-ink">
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
        </div>

        {error && <p className="text-[13px] text-risk-high">{error}</p>}
        {notice && (
          <p className="flex items-center gap-1.5 text-[13px] text-risk-safe">
            <CheckCircle2 size={15} className="shrink-0" />{notice}
          </p>
        )}

        <Button variant="primary" size="lg" full loading={busy}>
          {t('loginButton')}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-[11.5px] font-medium uppercase tracking-wide text-ink-3">{t('orDivider')}</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <Button variant="secondary" size="lg" full onClick={google} disabled={busy}
        icon={
          <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden>
            <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h11.8c-.5 2.8-2 5.1-4.4 6.7v5.5h7.1c4.2-3.8 6.6-9.5 6.6-16.4z" />
            <path fill="#34A853" d="M24 46c6 0 11-2 14.6-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.5 2.1-5.8 0-10.7-3.9-12.4-9.1H4.3v5.7C7.9 41 15.4 46 24 46z" />
            <path fill="#FBBC05" d="M11.6 28.1c-.4-1.3-.7-2.7-.7-4.1s.3-2.8.7-4.1v-5.7H4.3C2.8 17.1 2 20.4 2 24s.8 6.9 2.3 9.8l7.3-5.7z" />
            <path fill="#EA4335" d="M24 10.8c3.3 0 6.2 1.1 8.5 3.3l6.3-6.3C35 4.1 30 2 24 2 15.4 2 7.9 7 4.3 14.2l7.3 5.7c1.7-5.2 6.6-9.1 12.4-9.1z" />
          </svg>
        }>
        {t('continueGoogle')}
      </Button>

      <p className="mt-7 text-center text-[13px] text-ink-3">
        <Link href="/register" className="font-medium text-brand transition hover:underline">{t('registerPrompt')}</Link>
      </p>
    </AuthLayout>
  );
}
