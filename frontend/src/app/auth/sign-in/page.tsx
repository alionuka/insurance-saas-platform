'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Mail, Lock, Loader2, AlertCircle, CheckCircle2, User, UserCheck, Building2, Crown } from 'lucide-react';
import { setAuthData, getDashboardRedirect, UserRole } from '@/lib/auth';
import { useT } from '@/i18n/LocaleProvider';
import LocaleSwitcher from '@/i18n/LocaleSwitcher';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function SignInPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useT();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quickLoadingEmail, setQuickLoadingEmail] = useState<string | null>(null);

  const isResetSuccess = searchParams.get('reset') === 'true';

  // `role` is consumed by Playwright via data-testid — keeping it stable
  // (English) means the e2e suite doesn't break when the UI switches to UK.
  const DEMO_ACCOUNTS = [
    { role: 'CUSTOMER', label: t('auth.demoCustomer'), email: 'alice.customer@example.com', icon: User, color: 'bg-blue-500/5 text-blue-400 border-blue-500/20 hover:bg-blue-500/10' },
    { role: 'AGENT', label: t('auth.demoAgent'), email: 'emily.agent@example.com', icon: UserCheck, color: 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10' },
    { role: 'COMPANY_ADMIN', label: t('auth.demoCompanyAdmin'), email: 'sarah.admin@example.com', icon: Building2, color: 'bg-amber-500/5 text-amber-400 border-amber-500/20 hover:bg-amber-500/10' },
    { role: 'PLATFORM_ADMIN', label: t('auth.demoPlatform'), email: 'admin@insurance-saas.com', icon: Crown, color: 'bg-purple-500/5 text-purple-400 border-purple-500/20 hover:bg-purple-500/10' },
  ];

  const performLogin = async (targetEmail: string, targetPassword: string) => {
    setError(null);
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: targetEmail, password: targetPassword }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || t('auth.failedSignIn'));
    }
    setAuthData(data.access_token, data.refresh_token ?? '', data.user);
    router.push(getDashboardRedirect(data.user.role as UserRole));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await performLogin(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.failedSignIn'));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (acc: typeof DEMO_ACCOUNTS[number]) => {
    if (quickLoadingEmail) return;
    setQuickLoadingEmail(acc.email);
    setEmail(acc.email);
    setPassword('Password123!');
    try {
      await performLogin(acc.email, 'Password123!');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.failedSignIn'));
    } finally {
      setQuickLoadingEmail(null);
    }
  };

  return (
    <div className="bg-zinc-900 py-8 px-4 shadow-xl border border-zinc-800 sm:rounded-2xl sm:px-10">
      <form className="space-y-6" onSubmit={handleSubmit}>
        {isResetSuccess && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <p>{t('auth.resetSuccess')}</p>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

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
              className="appearance-none block w-full pl-10 pr-3 py-2 border border-zinc-800 rounded-lg bg-zinc-950 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
              placeholder={t('auth.emailPlaceholder')}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
              {t('auth.passwordLabel')}
            </label>
            <Link href="/auth/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              {t('auth.forgotPassword')}
            </Link>
          </div>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-zinc-500" />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none block w-full pl-10 pr-3 py-2 border border-zinc-800 rounded-lg bg-zinc-950 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
              placeholder={t('auth.passwordPlaceholder')}
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              t('auth.signInButton')
            )}
          </button>
        </div>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-zinc-900 text-zinc-500 uppercase tracking-widest text-[10px] font-bold">
              {t('auth.quickDemoDivider')}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((acc) => {
            const Icon = acc.icon;
            const isThisLoading = quickLoadingEmail === acc.email;
            return (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleQuickLogin(acc)}
                disabled={quickLoadingEmail !== null}
                className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${acc.color}`}
                title={acc.email}
                data-testid={`quick-login-${acc.role}`}
              >
                {isThisLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
                <span>{acc.label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-zinc-600 text-center mt-3">
          {t('auth.quickDemoHint')}
        </p>
      </div>
    </div>
  );
}

function SignInPageInner() {
  const { t } = useT();
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <div className="absolute top-4 right-4">
        <LocaleSwitcher variant="nav" />
      </div>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-indigo-500" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-white">
          {t('auth.signInTitle')}
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-400">
          {t('auth.signInSubtitle')}{' '}
          <Link href="/auth/sign-up" className="font-medium text-indigo-400 hover:text-indigo-300">
            {t('auth.needAccountPrompt')}
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense fallback={
          <div className="bg-zinc-900 py-12 px-4 shadow-xl border border-zinc-800 sm:rounded-2xl sm:px-10 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-700" />
          </div>
        }>
          <SignInPageContent />
        </Suspense>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return <SignInPageInner />;
}
