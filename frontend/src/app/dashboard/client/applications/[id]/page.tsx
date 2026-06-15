import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, ShieldAlert, TrendingUp, CheckCircle, ShieldCheck, Box, Calendar } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/formatDate';
import { getT } from '@/i18n/getT';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getApplication(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value ?? '';
  if (!token) return { status: 401 };

  try {
    const res = await fetch(`${API_URL}/applications/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });

    if (res.status === 401) return { status: 401 };
    if (res.status === 403) return { status: 403 };
    if (res.status === 404) return { status: 404 };
    if (!res.ok) return { status: 500 };

    const data = await res.json();
    return { status: 200, data };
  } catch (error) {
    return { status: 500 };
  }
}

export default async function ClientApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getApplication(id);
  const { t } = await getT();

  if (result.status === 401) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
        <p className="mt-4 text-slate-600 dark:text-slate-400">{t('dashboard.sessionExpired')}</p>
      </div>
    );
  }

  if (result.status === 403 || result.status === 404) {
    notFound();
  }

  if (result.status !== 200 || !result.data) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
        <h2 className="text-lg font-semibold">{t('dashboard.errorLoadingApp')}</h2>
        <p className="text-sm mt-1">{t('dashboard.errorLoadingAppDesc')}</p>
      </div>
    );
  }

  const app = result.data;
  const product = app.product;
  const risk = app.riskAssessments?.[0];
  const policy = app.policy;

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'REJECTED': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'PENDING': return 'bg-blue-700/10 text-blue-700 border-blue-700/20';
      case 'UNDER_REVIEW': return 'bg-blue-700/10 text-blue-700 border-blue-700/20';
      default: return 'bg-slate-100 text-slate-600 border-slate-300';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'text-emerald-400';
      case 'MEDIUM': return 'text-blue-700';
      case 'HIGH': return 'text-rose-400';
      default: return 'text-slate-600';
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <Link 
        href="/dashboard/client/applications"
        className="inline-flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-700 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t('dashboard.backToApps')}
      </Link>

      {/* Hero */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 flex items-start gap-4 shadow-xl">
        <div className="h-16 w-16 rounded-2xl bg-blue-700/10 border border-blue-700/20 flex items-center justify-center shrink-0">
          <FileText className="h-8 w-8 text-blue-700" />
        </div>
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
                {t('dashboard.appHeader')} <span className="font-mono text-slate-500 dark:text-slate-400 text-lg">#{app.id.slice(0, 8)}</span>
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">{t('dashboard.appHeaderSubtitle')}</p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusPill(app.status)}`}>
              {app.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Product Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <Box className="h-5 w-5 text-blue-700" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('dashboard.productOverview')}</h2>
          </div>
          {product ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{t('dashboard.insurancePlan')}</p>
                <p className="text-slate-900 dark:text-slate-100 font-medium text-lg mt-1">{product.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{t('dashboard.type')}</p>
                  <p className="text-slate-700 dark:text-slate-300 mt-1 uppercase font-bold text-sm bg-slate-100 dark:bg-slate-800 inline-block px-2 py-0.5 rounded">{product.type}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{t('dashboard.basePremium')}</p>
                  <p className="text-blue-700 mt-1 font-bold">{formatCurrency(product.basePremium)}</p>
                </div>
              </div>
              {product.company && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{t('dashboard.underwriter')}</p>
                  <p className="text-slate-700 dark:text-slate-300 mt-1 font-medium">{product.company.name}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400 italic">{t('dashboard.noProductDetails')}</p>
          )}
        </div>

        {/* Risk Assessment Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-md flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="h-5 w-5 text-blue-700" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('dashboard.riskAssessment')}</h2>
          </div>
          {risk ? (
            <div className="flex-1 flex flex-col">
              <div className="flex items-end gap-3 mb-4">
                <span className="text-4xl font-bold font-mono text-slate-900 dark:text-slate-100 leading-none">
                  {risk.riskScore.toFixed(0)}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400 mb-1">{t('dashboard.scoreSuffix')}</span>
              </div>
              <div className="mb-4">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-slate-50 dark:bg-[#060b1a] ${getRiskLevelColor(risk.riskLevel)} border-current/20`}>
                  {risk.riskLevel} {t('dashboard.riskSuffix')}
                </span>
              </div>
              <div className="mt-auto p-4 bg-slate-50 dark:bg-[#060b1a]/50 rounded-lg border border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-600 dark:text-slate-400 italic leading-relaxed">
                  "{risk.explanation}"
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('dashboard.riskNotReady')}</p>
            </div>
          )}
        </div>

        {/* Linked Policy Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-md md:col-span-2 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="mt-1 h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('dashboard.linkedPolicy')}</h2>
              {policy ? (
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {t('dashboard.policyNumber')}: <span className="font-mono font-bold text-slate-900 dark:text-slate-100 uppercase">{policy.policyNumber}</span>
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {t('dashboard.statusLabel')}: <span className="text-emerald-700 dark:text-emerald-400 font-medium">{policy.status.replace('_', ' ')}</span>
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {t('dashboard.premiumLabel')}: <span className="text-blue-700 font-bold">{formatCurrency(policy.premiumAmount)}</span>
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {app.status === 'APPROVED'
                    ? t('dashboard.policyGenerating')
                    : app.status === 'REJECTED'
                    ? t('dashboard.appRejected')
                    : t('dashboard.policyAfterApproval')}
                </p>
              )}
            </div>
          </div>
          {policy && (
            <Link
              href={`/dashboard/client/policies/${policy.id}`}
              className="inline-flex justify-center items-center px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20 shrink-0"
            >
              {t('dashboard.viewPolicy')}
            </Link>
          )}
        </div>

        {/* Timeline Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-md md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('dashboard.timeline')}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-[#060b1a]/50 rounded-lg border border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{t('dashboard.submittedOn')}</p>
              <p className="text-slate-700 dark:text-slate-300 mt-1 font-medium">{formatDate(app.createdAt)}</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-[#060b1a]/50 rounded-lg border border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{t('dashboard.lastUpdated')}</p>
              <p className="text-slate-700 dark:text-slate-300 mt-1 font-medium">{formatDate(app.updatedAt)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
