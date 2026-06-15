import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, UserCircle, Mail, Shield, Building2, Calendar, FileText, ShieldCheck, Activity, CreditCard, TrendingUp } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/formatDate';
import { getT } from '@/i18n/getT';
import { translateStatus, translateRiskLevel, translateRole } from '@/i18n/translateStatus';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const roleColors: Record<string, string> = {
  CUSTOMER: 'bg-blue-700/10 text-blue-700 border-blue-700/20',
  AGENT: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  COMPANY_ADMIN: 'bg-blue-700/10 text-blue-700 border-blue-700/20',
  PLATFORM_ADMIN: 'bg-blue-700/10 text-blue-700 border-blue-700/20',
};

async function getUser(id: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value ?? '';
    if (!token) return { status: 401 };

    const res = await fetch(`${API_URL}/admin/users/${id}`, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) return { status: 401 };
    if (res.status === 403) return { status: 403 };
    if (res.status === 404) return { status: 404 };
    if (!res.ok) return { status: 500 };

    const data = await res.json();
    return { user: data, status: 200 };
  } catch {
    return { status: 500 };
  }
}

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, status } = await getUser(id);
  const { t } = await getT();

  if (status === 401) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
        <p className="mt-4 text-slate-600 dark:text-slate-400">{t('dashboard.sessionExpired')}</p>
      </div>
    );
  }

  if (status === 403 || status === 404) {
    notFound();
  }

  if (status !== 200 || !user) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
        <h2 className="text-lg font-semibold">{t('users.errorLoadUser')}</h2>
        <p className="text-sm mt-1">{t('users.errorLoadUserDesc')}</p>
      </div>
    );
  }

  const isCustomer = user.role === 'CUSTOMER';
  const initials = `${(user.firstName?.[0] || '').toUpperCase()}${(user.lastName?.[0] || '').toUpperCase()}` || 'U';
  const applications = user.applications || [];
  const policies = user.policies || [];
  const claims = user.claims || [];

  const activePolicies = policies.filter((p: any) => p.status === 'ACTIVE');
  const openClaims = claims.filter((c: any) => c.status === 'FILED' || c.status === 'IN_PROGRESS');

  return (
    <div className="max-w-5xl space-y-6">
      <Link
        href="/dashboard/admin/users"
        className="inline-flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-700 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t('users.backToUsers')}
      </Link>

      {/* Hero */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 flex items-start gap-5 shadow-xl">
        <div className="h-16 w-16 rounded-2xl bg-blue-700/10 border border-blue-700/20 flex items-center justify-center text-2xl font-bold text-blue-700 shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{user.firstName} {user.lastName}</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-2">
            <Mail className="h-4 w-4" />
            {user.email}
          </p>
          <div className="mt-3">
            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${roleColors[user.role] || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'}`}>
              {translateRole(t, user.role)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Info */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <UserCircle className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('users.accountInfo')}</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{t('users.emailLabel')}</p>
                <p className="text-slate-900 dark:text-slate-100 font-mono text-sm mt-1">{user.email}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{t('users.firstNameLabel')}</p>
                  <p className="text-slate-900 dark:text-slate-100 text-sm mt-1">{user.firstName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{t('users.lastNameLabel')}</p>
                  <p className="text-slate-900 dark:text-slate-100 text-sm mt-1">{user.lastName}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{t('users.roleLabel')}</p>
                <p className="text-slate-900 dark:text-slate-100 text-sm mt-1">{translateRole(t, user.role)}</p>
              </div>
              {user.age != null && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{t('users.ageLabel')}</p>
                  <p className="text-slate-900 dark:text-slate-100 text-sm mt-1">{user.age}</p>
                </div>
              )}
              {user.annualIncome != null && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{t('users.annualIncomeLabel')}</p>
                  <p className="text-slate-900 dark:text-slate-100 text-sm mt-1">{formatCurrency(user.annualIncome)}</p>
                </div>
              )}
              {user.creditScore != null && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{t('users.creditScoreLabel')}</p>
                  <p className="text-slate-900 dark:text-slate-100 text-sm mt-1">{user.creditScore}</p>
                </div>
              )}
              {user.company && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{t('users.companyLabel')}</p>
                  <p className="text-slate-900 dark:text-slate-100 text-sm mt-1 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                    {user.company.name}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{t('users.memberSince')}</p>
                <p className="text-slate-700 dark:text-slate-300 text-sm mt-1 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                  {formatDate(user.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="lg:col-span-2 space-y-6">
          {isCustomer ? (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-blue-700/10 border border-blue-700/20 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{t('users.applicationsLabel')}</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{applications.length}</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{t('users.activePoliciesLabel')}</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{activePolicies.length}</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-blue-700/10 border border-blue-700/20 flex items-center justify-center shrink-0">
                    <Activity className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{t('users.openClaimsLabel')}</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{openClaims.length}</p>
                  </div>
                </div>
              </div>

              {/* Applications Summary */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-md">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-md font-bold text-slate-900 dark:text-slate-100">{t('users.recentApplications')}</h3>
                  <span className="bg-blue-700/10 text-blue-700 text-xs px-2.5 py-1 rounded-full font-medium">
                    {applications.length} {t('users.totalSuffix')}
                  </span>
                </div>
                {applications.length > 0 ? (
                  <div className="divide-y divide-zinc-800">
                    {applications.slice(0, 5).map((app: any) => (
                      <div key={app.id} className="px-6 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-900 dark:text-slate-100 font-medium">{app.product?.name || t('users.application')}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatDate(app.createdAt)}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          app.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' :
                          app.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20' :
                          'bg-blue-700/10 text-blue-700 border-blue-700/20'
                        }`}>
                          {translateStatus(t, app.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400 text-sm italic">{t('users.noApplications')}</div>
                )}
              </div>

              {/* Policies Summary */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-md">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-md font-bold text-slate-900 dark:text-slate-100">{t('users.policiesHeader')}</h3>
                  <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs px-2.5 py-1 rounded-full font-medium">
                    {policies.length} {t('users.totalSuffix')}
                  </span>
                </div>
                {policies.length > 0 ? (
                  <div className="divide-y divide-zinc-800">
                    {policies.slice(0, 5).map((pol: any) => (
                      <div key={pol.id} className="px-6 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-900 dark:text-slate-100 font-medium">{pol.product?.name || t('users.policy')}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">{pol.policyNumber}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          pol.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' :
                          pol.status === 'CANCELLED' ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20' :
                          'bg-blue-700/10 text-blue-700 border-blue-700/20'
                        }`}>
                          {translateStatus(t, pol.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400 text-sm italic">{t('users.noPolicies')}</div>
                )}
              </div>

              {/* Claims Summary */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-md">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-md font-bold text-slate-900 dark:text-slate-100">{t('users.claimsHeader')}</h3>
                  <span className="bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs px-2.5 py-1 rounded-full font-medium">
                    {claims.length} {t('users.totalSuffix')}
                  </span>
                </div>
                {claims.length > 0 ? (
                  <div className="divide-y divide-zinc-800">
                    {claims.slice(0, 5).map((claim: any) => (
                      <div key={claim.id} className="px-6 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-900 dark:text-slate-100 font-medium truncate max-w-xs">{claim.description || t('users.claim')}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatDate(claim.createdAt)} · {formatCurrency(claim.amount)}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          claim.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' :
                          claim.status === 'DENIED' ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20' :
                          'bg-blue-700/10 text-blue-700 border-blue-700/20'
                        }`}>
                          {translateStatus(t, claim.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400 text-sm italic">{t('users.noClaims')}</div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center shadow-md">
              <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-slate-500 dark:text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">{t('users.staffAccount')}</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
                {t('users.staffDesc').replace('{role}', user.role.replace('_', ' '))}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
