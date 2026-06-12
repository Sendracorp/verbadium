'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/client';

type Mode = 'login' | 'signup' | 'forgot' | 'reset';

const TITLES: Record<Mode, string> = {
  login: 'Log in',
  signup: 'Create your account',
  forgot: 'Reset your password',
  reset: 'Choose a new password',
};

export default function AuthForm({ mode, next = '/' }: { mode: Mode; next?: string }) {
  const router = useRouter();
  const supabase = getBrowserSupabase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const configured = !!supabase;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true); setError(null); setInfo(null);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setError(error.message); return; }
        router.push(next);
        router.refresh();
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
        });
        if (error) { setError(error.message); return; }
        if (data.session) { router.push(next); router.refresh(); }
        else setInfo('Almost there — check your inbox and click the confirmation link to activate your account.');
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent('/reset-password')}`,
        });
        if (error) { setError(error.message); return; }
        setInfo('If an account exists for that address, a password-reset link is on its way.');
      } else {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) { setError(error.message); return; }
        setInfo('Password updated — you are logged in.');
        setTimeout(() => { router.push('/'); router.refresh(); }, 1200);
      }
    } finally { setBusy(false); }
  }

  async function google() {
    if (!supabase) return;
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) setError(error.message);
  }

  const needsEmail = mode !== 'reset';
  const needsPassword = mode === 'login' || mode === 'signup' || mode === 'reset';

  return (
    <div className="card auth-card" data-test={`auth-${mode}`}>
      <h2>{TITLES[mode]}</h2>
      {!configured && (
        <p className="auth-notice" data-test="auth-unconfigured">
          Accounts aren’t enabled on this deployment yet — Supabase credentials are not configured.
        </p>
      )}
      {(mode === 'login' || mode === 'signup') && (
        <>
          <button type="button" className="btn auth-google" onClick={google} disabled={!configured || busy}>
            Continue with Google
          </button>
          <div className="auth-divider"><span>or with email</span></div>
        </>
      )}
      <form onSubmit={submit} className="auth-form">
        {needsEmail && (
          <label>Email
            <input
              type="email" required autoComplete="email" value={email}
              onChange={e => setEmail(e.target.value)} disabled={!configured || busy}
            />
          </label>
        )}
        {needsPassword && (
          <label>{mode === 'reset' ? 'New password' : 'Password'}
            <input
              type="password" required minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password} onChange={e => setPassword(e.target.value)} disabled={!configured || busy}
            />
          </label>
        )}
        {error && <p className="auth-error" data-test="auth-error">{error}</p>}
        {info && <p className="auth-info" data-test="auth-info">{info}</p>}
        <button type="submit" className="btn btn-primary" disabled={!configured || busy}>
          {busy ? 'One moment…' : TITLES[mode]}
        </button>
      </form>
      <div className="auth-links">
        {mode === 'login' && (
          <>
            <Link href={`/signup?next=${encodeURIComponent(next)}`}>No account yet? Sign up</Link>
            <Link href="/forgot-password">Forgot your password?</Link>
          </>
        )}
        {mode === 'signup' && <Link href={`/login?next=${encodeURIComponent(next)}`}>Already registered? Log in</Link>}
        {mode === 'forgot' && <Link href="/login">Back to log in</Link>}
      </div>
    </div>
  );
}
