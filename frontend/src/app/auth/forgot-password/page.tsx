'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Mail, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useT } from '@/i18n/LocaleProvider';
import LocaleSwitcher from '@/i18n/LocaleSwitcher';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ForgotPasswordPage() {
  const { t } = useT();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      // Regardless of status (to prevent account enumeration), show success.
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

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
          {t('auth.forgotTitle')}
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-400">
          {t('auth.forgotSubtitle')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-900 py-8 px-4 shadow-xl border border-zinc-800 sm:rounded-2xl sm:px-10">
          {!submitted ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
                  {t('auth.emailLabel')}
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-zinc-500" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-zinc-800 rounded-lg bg-zinc-950 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-all"
                    placeholder={t('auth.emailPlaceholder')}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    t('auth.sendResetLink')
                  )}
                </button>
              </div>

              <div className="text-center">
                <Link href="/auth/sign-in" className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-white transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                  {t('auth.backToSignIn')}
                </Link>
              </div>
            </form>
          ) : (
            <div className="text-center space-y-6 py-4 animate-in fade-in zoom-in-95 duration-500">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">{t('auth.checkEmail')}</h3>
                <p className="text-sm text-zinc-400 max-w-xs mx-auto leading-relaxed">
                  {t('auth.ifAccountExists')} <span className="text-zinc-200 font-medium">{email}</span>, {t('auth.resetLinkSent')}
                </p>
              </div>
              <div className="pt-4">
                <Link
                  href="/auth/sign-in"
                  className="w-full flex justify-center py-3 px-4 border border-zinc-800 rounded-lg text-sm font-semibold text-white bg-zinc-950 hover:bg-zinc-900 transition-all"
                >
                  {t('auth.returnToSignIn')}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
