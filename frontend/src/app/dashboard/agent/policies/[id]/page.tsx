import { ShieldAlert, ArrowLeft, CreditCard, Activity, FileText, Calendar, Building2, Package, ShieldCheck, CheckCircle2, Clock, UserCircle } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/formatDate';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getT } from '@/i18n/getT';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getPolicy(id: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value ?? '';
    if (!token) return { status: 401 };

    const res = await fetch(`${API_URL}/policies/${id}`, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return { status: res.status };
    const data = await res.json();
    return { policy: data, status: 200 };
  } catch (error) {
    return { status: 500 };
  }
}

export default async function AgentPolicyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { policy, status } = await getPolicy(id);
  const { t } = await getT();

  if (status === 401 || status === 403) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 border-2 border-dashed border-rose-900/30 rounded-3xl bg-rose-950/10 text-center">
        <ShieldAlert className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{t('dashboard.accessRestricted')}</h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-md">{t('dashboard.accessDeniedPolicy')}</p>
        <Link href="/dashboard/agent/applications" className="mt-6 text-sm font-bold text-blue-700 hover:text-blue-600 transition-colors uppercase tracking-widest">
          {t('dashboard.backToApps')}
        </Link>
      </div>
    );
  }

  if (status === 404) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <ShieldAlert className="h-12 w-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{t('dashboard.policyNotFound')}</h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-md">{t('dashboard.policyNotFoundDesc')}</p>
        <Link href="/dashboard/agent/applications" className="mt-6 text-sm font-bold text-blue-700 hover:text-blue-600 transition-colors uppercase tracking-widest">
          {t('dashboard.backToApps')}
        </Link>
      </div>
    );
  }

  if (status !== 200 || !policy) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mb-4"></div>
        <p className="text-slate-600 dark:text-slate-400">{t('dashboard.errorLoadingPolicyDesc')}</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'PENDING_PAYMENT': return 'bg-blue-700/10 text-blue-700 border-blue-700/20';
      case 'EXPIRED': return 'bg-slate-100 text-slate-500 border-slate-300';
      case 'CANCELLED': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-slate-100 text-slate-500 border-slate-300';
    }
  };

  // Agent-specific: derive customer info via the linked application's user
  const customer = policy.application?.user ?? null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <Link
        href={policy.application ? `/dashboard/agent/applications/${policy.application.id}` : '/dashboard/agent/applications'}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors uppercase tracking-widest group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        {t('dashboard.backToApp')}
      </Link>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 md:p-10">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4">
          <div className="h-64 w-64 rounded-full bg-blue-700/5 blur-3xl"></div>
        </div>

        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">{policy.product.name}</h1>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(policy.status)}`}>
                {policy.status.replace('_', ' ')}
              </span>
            </div>
            <div className="space-y-1">
              <p className="font-mono text-slate-500 dark:text-slate-400 text-sm tracking-tight">{t('dashboard.policyId')}: {policy.policyNumber}</p>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Calendar className="h-4 w-4" />
                <p className="text-sm">{t('dashboard.coverage')}: {formatDate(policy.startDate)} – {formatDate(policy.endDate)}</p>
              </div>
            </div>
          </div>

          <div className="text-left md:text-right">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-widest mb-1">{t('dashboard.annualPremium')}</p>
            <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(policy.premiumAmount)}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-widest mt-3">{t('dashboard.readOnlyAgent')}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-blue-700/10 border border-blue-700/20 flex items-center justify-center">
            <Package className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">{t('dashboard.productType')}</p>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{policy.product.type}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">{t('dashboard.provider')}</p>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{policy.product.company.name}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-blue-700/10 border border-blue-700/20 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">{t('dashboard.statusLabel')}</p>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{policy.status.replace('_', ' ')}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center">
            <Clock className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">{t('dashboard.effectiveSince')}</p>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatDate(policy.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Customer card — distinguishes agent view from client view */}
      {customer && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserCircle className="h-5 w-5 text-blue-700" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('dashboard.policyHolder')}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">{t('dashboard.name')}</p>
              <p className="text-slate-900 dark:text-slate-100 font-medium mt-1">{customer.firstName} {customer.lastName}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">{t('dashboard.email')}</p>
              <p className="text-slate-700 dark:text-slate-300 mt-1 text-sm">{customer.email}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">{t('dashboard.creditScore')}</p>
              <p className="text-slate-700 dark:text-slate-300 mt-1 font-mono">{customer.creditScore ?? 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Claims */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-rose-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('dashboard.claimsHistory')}</h2>
          </div>

          <div className="space-y-4">
            {policy.claims && policy.claims.length > 0 ? (
              policy.claims.map((claim: any) => (
                <Link key={claim.id} href={`/dashboard/agent/claims/${claim.id}`} className="block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">{t('dashboard.claimNumber')} #{claim.id.substring(0, 8)}</p>
                        <p className="text-slate-800 dark:text-slate-200 italic">"{claim.description}"</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                        claim.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' :
                        claim.status === 'DENIED' ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                      }`}>
                        {claim.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-widest">{t('dashboard.amount')}</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatCurrency(claim.amount)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-widest">{t('dashboard.filedOn')}</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300 font-mono">{formatDate(claim.createdAt)}</p>
                        </div>
                      </div>

                      {claim.fraudAssessments?.[0] && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#060b1a]/50 border border-slate-200 dark:border-slate-800/50">
                          <ShieldCheck className={`h-3 w-3 ${claim.fraudAssessments[0].flag === 'SUSPICIOUS' ? 'text-rose-500' : 'text-emerald-500'}`} />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                            {t('dashboard.fraudShort')}: <span className={claim.fraudAssessments[0].flag === 'SUSPICIOUS' ? 'text-rose-400' : 'text-emerald-400'}>{claim.fraudAssessments[0].flag}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 border-dashed rounded-2xl p-12 text-center">
                <Activity className="h-10 w-10 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 dark:text-slate-400">{t('dashboard.noClaimsAgent')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Payments sidebar */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('dashboard.paymentHistory')}</h2>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-[#060b1a] text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-5 py-3">{t('dashboard.date')}</th>
                    <th className="px-5 py-3">{t('dashboard.amount')}</th>
                    <th className="px-5 py-3 text-right">{t('dashboard.statusLabel')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {policy.payments && policy.payments.length > 0 ? (
                    policy.payments.map((payment: any) => (
                      <tr key={payment.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-5 py-4">
                          <p className="text-xs text-slate-700 dark:text-slate-300 font-mono">{formatDate(payment.createdAt)}</p>
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 truncate max-w-[80px]">{payment.stripePaymentId}</p>
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${
                            payment.status === 'SUCCEEDED' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' :
                            payment.status === 'FAILED' ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20' :
                            'bg-blue-700/10 text-blue-700 border-blue-700/20'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-5 py-10 text-center text-slate-500 dark:text-slate-400 italic">{t('dashboard.noPayments')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
