import { cookies } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft, Activity, ShieldCheck, ShieldAlert, AlertTriangle, TrendingUp, AlertCircle } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/formatDate';
import ClaimDocuments from '@/components/ClaimDocuments';
import { getT } from '@/i18n/getT';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getClaimDetails(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) {
    return { status: 401, data: null };
  }

  try {
    const res = await fetch(`${API_URL}/claims/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (res.status === 401 || res.status === 403) {
      return { status: 403, data: null };
    }
    if (res.status === 404) {
      return { status: 404, data: null };
    }
    if (!res.ok) {
      return { status: res.status, data: null };
    }

    const data = await res.json();
    return { status: 200, data };
  } catch (error) {
    return { status: 500, data: null };
  }
}

export default async function ClientClaimDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status, data: claim } = await getClaimDetails(id);
  const { t } = await getT();

  if (status === 401 || status === 403) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <ShieldAlert className="h-16 w-16 text-rose-500" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('dashboard.accessDenied')}</h1>
        <p className="text-slate-600 dark:text-slate-400">{t('dashboard.accessDeniedClaim')}</p>
        <Link href="/dashboard/client" className="text-blue-700 hover:text-blue-600 font-medium">
          {t('dashboard.returnToDash')}
        </Link>
      </div>
    );
  }

  if (status === 404 || !claim) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <AlertTriangle className="h-16 w-16 text-blue-500" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('dashboard.claimNotFound')}</h1>
        <p className="text-slate-600 dark:text-slate-400">{t('dashboard.claimNotFoundDesc')}</p>
        <Link href="/dashboard/client" className="text-blue-700 hover:text-blue-600 font-medium">
          {t('dashboard.returnToDash')}
        </Link>
      </div>
    );
  }

  const fraud = claim.fraudAssessments?.[0];
  const policy = claim.policy;
  const product = claim.application?.product;
  const company = product?.company;

  const statusColors: Record<string, string> = {
    FILED: 'bg-blue-700/10 text-blue-700 border-blue-700/20',
    IN_PROGRESS: 'bg-blue-700/10 text-blue-700 border-blue-700/20',
    APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    DENIED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  const fraudFlagColors: Record<string, string> = {
    NORMAL: 'text-emerald-400',
    SUSPICIOUS: 'text-blue-700',
    FRAUDULENT: 'text-rose-400',
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <Link href="/dashboard/client" className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-sm font-medium">
        <ArrowLeft className="h-4 w-4" />
        {t('dashboard.backToDash')}
      </Link>

      {/* Hero Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-300 dark:border-slate-700 flex-shrink-0">
              <Activity className="h-8 w-8 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  {t('dashboard.claimNumber')} #{claim.id.substring(0, 8)}
                </h1>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${statusColors[claim.status] || 'bg-zinc-500/10 text-slate-600 dark:text-slate-400 border-zinc-500/20'}`}>
                  {claim.status}
                </span>
              </div>
              <p className="text-xl text-slate-700 dark:text-slate-300 font-medium mb-1">
                {formatCurrency(claim.amount)}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t('dashboard.filedColon')} {formatDate(claim.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Linked Policy Section */}
      <div>
        {policy ? (
          <Link href={`/dashboard/client/policies/${policy.id}`} className="block group">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-center gap-4 group-hover:border-slate-300 transition-colors">
              <div className="h-12 w-12 rounded-xl bg-blue-700/10 flex items-center justify-center border border-blue-700/20 flex-shrink-0">
                <ShieldCheck className="h-6 w-6 text-blue-700" />
              </div>
              <div className="flex-grow">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-0.5">{t('dashboard.policyHash')}{policy.policyNumber}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">{product?.name || t('dashboard.unknownProduct')} • {company?.name || t('dashboard.unknownCompany')}</p>
              </div>
              <div className="text-slate-500 dark:text-slate-400 group-hover:text-slate-900 transition-colors">
                <ArrowLeft className="h-5 w-5 rotate-180" />
              </div>
            </div>
          </Link>
        ) : (
          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 border-dashed rounded-xl p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-300 dark:border-slate-700 flex-shrink-0">
              <ShieldCheck className="h-6 w-6 text-slate-500 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-0.5">{t('dashboard.noPolicyLinked')}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('dashboard.applicationColon')} {claim.applicationId}</p>
            </div>
          </div>
        )}
      </div>

      {/* Description Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 md:p-8">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">{t('dashboard.incidentDescription')}</h2>
        <div className="bg-slate-50 dark:bg-[#060b1a]/50 rounded-lg p-5 border border-slate-200 dark:border-slate-800/50">
          <p className="text-slate-700 dark:text-slate-300 italic leading-relaxed whitespace-pre-wrap">
            "{claim.description}"
          </p>
        </div>
      </div>

      {/* Fraud Assessment Section */}
      {fraud && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6">
            <ShieldAlert className="h-5 w-5 text-blue-700" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('dashboard.fraudAssessment')}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1 p-4 rounded-lg bg-slate-50 dark:bg-[#060b1a]/50 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">{t('dashboard.score')}</span>
              </div>
              <p className="text-2xl font-mono font-bold text-slate-900 dark:text-slate-100">
                {fraud.fraudScore.toFixed(1)}<span className="text-sm text-slate-500 dark:text-slate-400 ml-1">/ 100</span>
              </p>
            </div>
            <div className="md:col-span-1 p-4 rounded-lg bg-slate-50 dark:bg-[#060b1a]/50 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">{t('dashboard.flag')}</span>
              </div>
              <p className={`text-xl font-bold ${fraudFlagColors[fraud.flag] || 'text-slate-600 dark:text-slate-400'}`}>
                {fraud.flag}
              </p>
            </div>
            <div className="md:col-span-2 p-4 rounded-lg bg-slate-50 dark:bg-[#060b1a]/50 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">{t('dashboard.mlAssessment')}</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 italic leading-relaxed">
                "{fraud.explanation}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Documents Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 md:p-8">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">{t('dashboard.supportingDocs')}</h2>
        <ClaimDocuments claimId={claim.id} canUpload={true} />
      </div>

    </div>
  );
}
