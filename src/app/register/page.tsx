'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, User as UserIcon } from 'lucide-react';
import { AuthLayout } from '@/components/AuthLayout';
import { Button, FieldRow, Input } from '@/components/ui';
import { useApp } from '@/providers/AppProvider';
import { register, authMessage } from '@/lib/auth-actions';

export default function RegisterScreen() {
  const { t, user, firebaseReady, loginAsGuest } = useApp();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // A signed-in user has no reason to see the sign-up form.
  useEffect(() => { if (user) router.replace('/dashboard'); }, [user, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    setBusy(true); setError('');
    if (!firebaseReady) {
      loginAsGuest(name.trim() || 'Farmer', email.trim());
      router.replace('/dashboard');
      setBusy(false);
      return;
    }
    try {
      await register(name.trim(), email.trim(), password);
      router.replace('/dashboard');
    } catch (err) {
      console.warn('[AgroVision] Registration failed, using guest mode:', err);
      loginAsGuest(name.trim() || 'Farmer', email.trim());
      router.replace('/dashboard');
    } finally { setBusy(false); }
  }

  return (
    <AuthLayout>
      <h1 className="text-title text-ink">{t('createAccount')}</h1>
      <p className="mt-1.5 text-[13.5px] text-ink-2">{t('joinUs')}</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <FieldRow label={t('fullName')} htmlFor="name">
          <Input id="name" required autoComplete="name" icon={<UserIcon size={15} />}
            placeholder="Priya Kumar" value={name} onChange={(e) => setName(e.target.value)} />
        </FieldRow>
        <FieldRow label={t('email')} htmlFor="email">
          <Input id="email" type="email" required autoComplete="email" icon={<Mail size={15} />}
            placeholder="you@farm.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </FieldRow>
        <FieldRow label={t('password')} htmlFor="password" hint="At least 6 characters.">
          <Input
            id="password"
            type={show ? 'text' : 'password'}
            required
            autoComplete="new-password"
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
        </FieldRow>

        {error && <p className="text-[13px] text-risk-high">{error}</p>}

        <Button variant="primary" size="lg" full loading={busy}>
          {t('registerButton')}
        </Button>
      </form>

      <p className="mt-7 text-center text-[13px] text-ink-3">
        <Link href="/login" className="font-medium text-brand transition hover:underline">{t('loginPrompt')}</Link>
      </p>
    </AuthLayout>
  );
}
