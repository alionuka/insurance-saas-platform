import { cookies } from 'next/headers';
import Link from 'next/link';
import { ShieldCheck, CreditCard } from 'lucide-react';
import { formatDate } from '@/lib/formatDate';
import PolicyPaymentButton from '@/components/PolicyPaymentButton';
import StopClickPropagation from '@/components/StopClickPropagation';
import EmptyState from '@/components/ui/EmptyState';
import PolicyFilters from './PolicyFilters';
import { getT } from '@/i18n/getT';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getPolicies() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value ?? '';
    const authHeader: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    const res = await fetch(`${API_URL}/policies`, { 
      cache: 'no-store',
      headers: authHeader,
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items ?? [];
  } catch (error) {
    return [];
  }
}

type Props = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> };

export default async function ClientPoliciesPage(props: Props) {
  const searchParams = await props.searchParams;
  const statusFilter = typeof searchParams.status === 'string' ? searchParams.status : 'all';

  const allPolicies = await getPolicies();
  const { t } = await getT();
  
  const counts = allPolicies.reduce((acc: any, policy: any) => {
    acc['all'] = (acc['all'] || 0) + 1;
    acc[policy.status] = (acc[policy.status] || 0) + 1;
    return acc;
  }, { all: 0 });

  const policies = statusFilter === 'all' 
    ? allPolicies 
    : allPolicies.filter((p: any) => p.status === statusFilter);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{t('clientPolicies.title')}</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">{t('clientPolicies.subtitle')}</p>
      </div>

      <PolicyFilters counts={counts} />

      <div className="grid gap-4">
        {policies.length > 0 ? (
          policies.map((policy: any) => (
            <Link key={policy.id} href={`/dashboard/client/policies/${policy.id}`} className="block group">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden group-hover:border-slate-300 transition-colors">
                {policy.status === 'PENDING_PAYMENT' && (
                  <div className="bg-blue-700/5 border-b border-blue-700/10 px-5 py-2.5 flex items-center justify-between gap-4 relative z-10">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-blue-700" />
                      <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">{t('clientPolicies.actionRequired')}</p>
                    </div>
                    <StopClickPropagation>
                      <PolicyPaymentButton policyId={policy.id} amount={policy.premiumAmount} />
                    </StopClickPropagation>
                  </div>
                )}
                
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-300 dark:border-slate-700 flex-shrink-0">
                      <ShieldCheck className="h-6 w-6 text-blue-700" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">{policy.product?.name || t('clientApps.unknownProduct')}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase border border-slate-300 dark:border-slate-700">
                          {policy.product?.type}
                        </span>
                      </div>
                      <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">{policy.product?.company?.name || t('clientApps.unknownCompany')}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">{t('clientPolicies.policyNumber')}: {policy.policyNumber}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-right mr-4 hidden md:block">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">{t('clientPolicies.coveragePeriod')}</p>
                      <p className="text-xs text-slate-700 dark:text-slate-300">{formatDate(policy.startDate)} {t('clientPolicies.coverageTo')} {formatDate(policy.endDate)}</p>
                    </div>
                    <span className={`text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider border ${
                      policy.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' : 
                      policy.status === 'PENDING_PAYMENT' ? 'bg-blue-700/10 text-blue-700 border-blue-700/20' :
                      'bg-zinc-500/10 text-slate-600 dark:text-slate-400 border-zinc-500/20'
                    }`}>
                      {policy.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                
                {/* Footer info */}
                <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-[#060b1a]/30 flex items-center justify-between">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-tight">
                    {t('clientPolicies.linkedApplication')}: <span className="text-slate-600 dark:text-slate-400 ml-1">{policy.applicationId.substring(0, 8)}...</span>
                  </p>
                  <div className="text-[10px] text-blue-700 group-hover:text-blue-600 font-bold uppercase tracking-tight transition-colors">
                    {t('clientPolicies.viewDetails')}
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <EmptyState
            icon={ShieldCheck}
            title={t('clientPolicies.emptyTitle')}
            description={t('clientPolicies.emptyHint')}
            action={{ label: t('clientPolicies.emptyAction'), href: '/dashboard/client/applications' }}
          />
        )}
      </div>
    </div>
  );
}
