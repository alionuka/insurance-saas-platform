'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, UserCheck, Building2, Crown, Loader2 } from 'lucide-react';
import { setAuthData, getDashboardRedirect, UserRole } from '@/lib/auth';
import { useT } from '@/i18n/LocaleProvider';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * One-click demo login. Renders 4 colored buttons (Customer / Agent /
 * Co.Admin / Platform) that hit the seeded `/auth/login` endpoint and
 * redirect to the corresponding dashboard.
 *
 * Gated behind NEXT_PUBLIC_DEMO_MODE so this never leaks into a real
 * production deployment — the seeded passwords would be a security
 * hazard otherwise. Local dev (.env.local sets the flag) and Playwright
 * e2e see them; public Vercel without the var hides them.
 *
 * Variants:
 *   - `landing` — large pill-style buttons for the landing page hero
 *   - `compact` — small icon+label buttons for the sign-in page footer
 */
type Variant = 'landing' | 'compact';

// Light-theme role swatches — soft tints, strong text. Each role has a
// distinct hue so demo users can be told apart at a glance, but all of
// them sit calmly on the off-white landing page.
const ACCOUNTS = [
  {
    role: 'CUSTOMER' as const,
    labelKey: 'auth.demoCustomer',
    email: 'alice.customer@example.com',
    icon: User,
    color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  },
  {
    role: 'AGENT' as const,
    labelKey: 'auth.demoAgent',
    email: 'emily.agent@example.com',
    icon: UserCheck,
    color:
      'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  },
  {
    role: 'COMPANY_ADMIN' as const,
    labelKey: 'auth.demoCompanyAdmin',
    email: 'sarah.admin@example.com',
    icon: Building2,
    color:
      'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  },
  {
    role: 'PLATFORM_ADMIN' as const,
    labelKey: 'auth.demoPlatform',
    email: 'admin@insurance-saas.com',
    icon: Crown,
    color:
      'bg-slate-100 text-slate-900 border-slate-300 hover:bg-slate-200',
  },
];

export default function DemoLoginRow({
  variant = 'landing',
}: {
  variant?: Variant;
}) {
  const router = useRouter();
  const { t } = useT();
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);

  // Hide entirely outside demo mode — the seeded passwords must not reach
  // real production sign-in pages.
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') return null;

  const handleLogin = async (email: string) => {
    if (loadingEmail) return;
    setLoadingEmail(email);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'Password123!' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to sign in');
      }
      setAuthData(data.access_token, data.refresh_token ?? '', data.user);
      router.push(getDashboardRedirect(data.user.role as UserRole));
    } catch (err) {
      console.error('Demo login failed:', err);
      setLoadingEmail(null);
    }
  };

  if (variant === 'landing') {
    return (
      <div className="mt-12 max-w-3xl mx-auto">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">
          {t('landing.demoTryRoleLabel')}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {ACCOUNTS.map((acc) => {
            const Icon = acc.icon;
            const isLoading = loadingEmail === acc.email;
            return (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleLogin(acc.email)}
                disabled={loadingEmail !== null}
                data-testid={`landing-demo-${acc.role}`}
                className={`inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-bold transition-all  disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 ${acc.color}`}
                title={acc.email}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                <span>{t(acc.labelKey)}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-400 text-center mt-3">
          {t('landing.demoTryRoleHint')}
        </p>
      </div>
    );
  }

  // Compact variant (sign-in page) — kept for backward compatibility,
  // sign-in page renders its own version inline today.
  return null;
}
