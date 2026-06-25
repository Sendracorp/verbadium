'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/client';
import { getDict, type Locale } from '@/lib/i18n';
import Logo from './Logo';

type Mode = 'login' | 'signup' | 'forgot' | 'reset';

/* Official multi-colour Google “G”, per Google’s Sign-in branding guidelines. */
function GoogleIcon() {
  return (
    <svg className="auth-google-icon" width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export default function AuthForm({ mode, next = '/', lang = 'en' }: { mode: Mode; next?: string; lang?: Locale }) {
  const router = useRouter();
  const a = getDict(lang).auth;
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
        else setInfo(a.checkInbox);
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent('/reset-password')}`,
        });
        if (error) { setError(error.message); return; }
        setInfo(a.resetSent);
      } else {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) { setError(error.message); return; }
        setInfo(a.passwordUpdated);
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
      <div className="auth-head">
        <Logo variant="mark" size={44} />
        <h2>{a.titles[mode]}</h2>
        <p className="auth-sub">{a.subtitles[mode]}</p>
      </div>
      {!configured && (
        <p className="auth-notice" data-test="auth-unconfigured">
          {a.unconfigured}
        </p>
      )}
      {(mode === 'login' || mode === 'signup') && (
        <>
          <button type="button" className="auth-google" onClick={google} disabled={!configured || busy}>
            <GoogleIcon />
            <span>{a.google}</span>
          </button>
          <div className="auth-divider"><span>{a.orEmail}</span></div>
        </>
      )}
      <form onSubmit={submit} className="auth-form">
        {needsEmail && (
          <label>{a.email}
            <input
              type="email" required autoComplete="email" value={email}
              onChange={e => setEmail(e.target.value)} disabled={!configured || busy}
            />
          </label>
        )}
        {needsPassword && (
          <label>{mode === 'reset' ? a.newPassword : a.password}
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
          {busy ? a.busy : a.actions[mode]}
        </button>
      </form>
      <div className="auth-links">
        {mode === 'login' && (
          <>
            <Link href={`/signup?next=${encodeURIComponent(next)}`}>{a.noAccount}</Link>
            <Link href="/forgot-password">{a.forgotLink}</Link>
          </>
        )}
        {mode === 'signup' && <Link href={`/login?next=${encodeURIComponent(next)}`}>{a.haveAccount}</Link>}
        {mode === 'forgot' && <Link href="/login">{a.backToLogin}</Link>}
      </div>
    </div>
  );
}
