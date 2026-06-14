'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Lock, Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useT } from '@/i18n/LocaleProvider';
import LocaleSwitcher from '@/i18n/LocaleSwitcher';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { t } = useT();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordsDontMatch'));
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError(t('auth.passwordTooShort'));
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('auth.failedReset'));
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/sign-in?reset=true');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.failedReset'));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-6 py-4 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-rose-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white">{t('auth.invalidLink')}</h3>
          <p className="text-sm text-zinc-400 max-w-xs mx-auto leading-relaxed">
            {t('auth.invalidLinkHint')}
          </p>
        </div>
        <div className="pt-4">
          <Link
            href="/auth/forgot-password"
            className="w-full flex justify-center py-3 px-4 border border-zinc-800 rounded-lg text-sm font-semibold text-white bg-zinc-950 hover:bg-zinc-900 transition-all"
          >
            {t('auth.requestNewLink')}
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center space-y-6 py-4 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white">{t('auth.passwordUpdated')}</h3>
          <p className="text-sm text-zinc-400">
            {t('auth.redirectingToSignIn')}
          </p>
        </div>
        <div className="pt-4 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-zinc-300">
            {t('auth.newPasswordLabel')}
          </label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-zinc-500" />
            </div>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-zinc-800 rounded-lg bg-zinc-950 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-all"
              placeholder={t('auth.passwordPlaceholder')}
            />
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-300">
            {t('auth.confirmNewPasswordLabel')}
          </label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-zinc-500" />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-zinc-800 rounded-lg bg-zinc-950 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-all"
              placeholder={t('auth.passwordPlaceholder')}
            />
          </div>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <span className="flex items-center gap-2">
              {t('auth.updatePassword')}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          )}
        </button>
      </div>
    </form>
  );
}

function ResetPasswordInner() {
  const { t } = useT();
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <div className="absolute top-4 right-4">
        <LocaleSwitcher variant="nav" />
      </div>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-white">
          {t('auth.resetTitle')}
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-400">
          {t('auth.resetSubtitle')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-900 py-8 px-4 shadow-xl border border-zinc-800 sm:rounded-2xl sm:px-10">
          <Suspense fallback={
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-700" />
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <ResetPasswordInner />;
}
