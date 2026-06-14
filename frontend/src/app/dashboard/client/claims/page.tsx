import { cookies } from 'next/headers';
import Link from 'next/link';
import { Activity, TrendingUp, AlertCircle, AlertTriangle } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/formatDate';
import ClaimSubmissionForm from '@/components/ClaimSubmissionForm';
import ClaimDocuments from '@/components/ClaimDocuments';
import StopClickPropagation from '@/components/StopClickPropagation';
import EmptyState from '@/components/ui/EmptyState';
import ClaimFilters from './ClaimFilters';
import { getT } from '@/i18n/getT';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getClaimsAndPolicies() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value ?? '';
    const authHeader: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    const [claimsRes, policiesRes] = await Promise.all([
      fetch(`${API_URL}/claims`, { 
        cache: 'no-store',
        headers: authHeader,
      }).catch(() => null),
      fetch(`${API_URL}/policies`, { 
        cache: 'no-store',
        headers: authHeader,
      }).catch(() => null),
    ]);

    const claimsJson = claimsRes && claimsRes.ok ? await claimsRes.json() : { items: [] };
    const policiesJson = policiesRes && policiesRes.ok ? await policiesRes.json() : { items: [] };

    return {
      claims: claimsJson.items ?? [],
      policies: policiesJson.items ?? [],
    };
  } catch (error) {
    return { claims: [], policies: [] };
  }
}

type Props = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> };

export default async function ClientClaimsPage(props: Props) {
  const searchParams = await props.searchParams;
  const statusFilter = typeof searchParams.status === 'string' ? searchParams.status : 'all';
  const preselectPolicyId = typeof searchParams.policyId === 'string' ? searchParams.policyId : undefined;

  const { claims: allClaims, policies } = await getClaimsAndPolicies();
  const { t } = await getT();
  
  const counts = allClaims.reduce((acc: any, claim: any) => {
    acc['all'] = (acc['all'] || 0) + 1;
    acc[claim.status] = (acc[claim.status] || 0) + 1;
    return acc;
  }, { all: 0 });

  const claims = statusFilter === 'all' 
    ? allClaims 
    : allClaims.filter((c: any) => c.status === statusFilter);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t('clientClaims.title')}</h1>
        <p className="text-slate-600 mt-1 text-sm">{t('clientClaims.subtitle')}</p>
      </div>

      <ClaimSubmissionForm policies={policies} preselectPolicyId={preselectPolicyId} />

      <ClaimFilters counts={counts} />

      <div className="grid gap-4 mt-8">
        {claims.length > 0 ? (
          claims.map((claim: any) => {
            const fraud = claim.fraudAssessments?.[0];
            return (
              <Link key={claim.id} href={`/dashboard/client/claims/${claim.id}`} className="block group">
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden group-hover:border-slate-300 transition-colors">
                  <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-300 flex-shrink-0">
                        <Activity className="h-6 w-6 text-emerald-400" />
                      </div>
                    <div className="flex-grow">
                      <h3 className="font-bold text-slate-900 text-lg">{claim.application?.product?.name || t('sidebar.nav.claims')}</h3>
                      <p className="text-sm text-slate-700 mt-1 font-medium">{claim.description}</p>
                      <p className="text-xs text-slate-500 mt-1 italic">{t('clientClaims.claimId')}: {claim.id.substring(0, 8)} • {t('clientClaims.amount')}: {formatCurrency(claim.amount)} • {t('clientClaims.filed')}: {formatDate(claim.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                      <span className={`text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider border ${
                      claim.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                      claim.status === 'DENIED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                      'bg-zinc-500/10 text-slate-600 border-zinc-500/20'
                    }`}>
                      {claim.status}
                    </span>
                  </div>
                </div>

                {/* Fraud Assessment Info */}
                {fraud && (
                  <div className="px-5 pb-5 pt-0 border-t border-slate-200/50 bg-slate-50/30">
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-1 p-3 rounded-lg bg-white/50 border border-slate-200">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="h-3 w-3 text-slate-500" />
                          <span className="text-[10px] text-slate-500 uppercase font-bold">{t('clientClaims.fraudScore')}</span>
                        </div>
                        <p className="text-lg font-mono font-bold text-slate-900">{fraud.fraudScore.toFixed(1)}<span className="text-xs text-slate-500 ml-1">/ 100</span></p>
                      </div>
                      <div className="md:col-span-1 p-3 rounded-lg bg-white/50 border border-slate-200">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="h-3 w-3 text-slate-500" />
                          <span className="text-[10px] text-slate-500 uppercase font-bold">{t('clientClaims.fraudFlag')}</span>
                        </div>
                        <p className={`text-lg font-bold ${
                          fraud.flag === 'NORMAL' ? 'text-emerald-400' : 'text-rose-400 animate-pulse'
                        }`}>{fraud.flag}</p>
                      </div>
                      <div className="md:col-span-2 p-3 rounded-lg bg-white/50 border border-slate-200">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="h-3 w-3 text-slate-500" />
                          <span className="text-[10px] text-slate-500 uppercase font-bold">{t('clientClaims.mlAssessment')}</span>
                        </div>
                        <p className="text-xs text-slate-600 italic leading-relaxed">"{fraud.explanation}"</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Documents Section */}
                <StopClickPropagation>
                <div className="px-5 pb-4 border-t border-slate-200/50">
                  <details className="group">
                    <summary className="list-none cursor-pointer py-2 flex items-center gap-2 text-[10px] text-slate-500 hover:text-blue-700 uppercase font-bold tracking-tight transition-colors">
                      <span className="group-open:rotate-90 transition-transform">▶</span>
                      {t('clientClaims.supportingDocuments')}
                    </summary>
                    <div className="pt-1">
                      <ClaimDocuments claimId={claim.id} canUpload={true} />
                    </div>
                  </details>
                </div>
                </StopClickPropagation>
              </div>
              </Link>
            );
          })
        ) : (
          <EmptyState
            icon={Activity}
            title={t('clientClaims.emptyTitle')}
            description={t('clientClaims.emptyHint')}
          />
        )}
      </div>
    </div>
  );
}
