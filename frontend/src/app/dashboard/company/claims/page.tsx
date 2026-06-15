import { cookies } from 'next/headers';
import EmptyState from '@/components/ui/EmptyState';
import { Activity, AlertTriangle } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/formatDate';
import { getT } from '@/i18n/getT';
import { translateStatus } from '@/i18n/translateStatus';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getClaims() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value ?? '';
    if (!token) return [];

    const authHeader: HeadersInit = { Authorization: `Bearer ${token}` };

    const res = await fetch(`${API_URL}/claims`, { 
      cache: 'no-store',
      headers: authHeader,
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items ?? [];
  } catch {
    return [];
  }
}

export default async function CompanyClaimsPage() {
  const { t } = await getT();
  const claims = await getClaims();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{t('tail.companyClaims')}</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">{t('tail.companyClaimsDesc')}</p>
      </div>

      {claims.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[800px]">
              <thead className="bg-slate-50 dark:bg-[#060b1a] text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-3">{t('tail.claimId')}</th>
                  <th className="px-6 py-3">{t('finale.customerCol')}</th>
                  <th className="px-6 py-3 text-right">{t('finale.amountCol')}</th>
                  <th className="px-6 py-3 text-center">{t('finale.statusCol')}</th>
                  <th className="px-6 py-3 text-right">{t('tail.fraudScore')}</th>
                  <th className="px-6 py-3 text-right">{t('tail.filedDate')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {claims.map((claim: any) => {
                  const fraud = claim.fraudAssessments?.[0];
                  return (
                    <tr key={claim.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-slate-100 uppercase">
                        {claim.id.substring(0, 8)}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-700 dark:text-slate-300 font-medium">{claim.user?.firstName} {claim.user?.lastName}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{claim.application?.product?.name}</p>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {formatCurrency(claim.amount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${
                          claim.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' : 
                          claim.status === 'DENIED' ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20' : 
                          'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                        }`}>
                          {translateStatus(t, claim.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {fraud ? (
                          <div className="flex flex-col items-end">
                            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{fraud.fraudScore.toFixed(1)}</span>
                            <div className="flex items-center gap-1">
                              {fraud.flag === 'SUSPICIOUS' && <AlertTriangle className="h-3 w-3 text-rose-700 dark:text-rose-400" />}
                              <span className={`text-[9px] font-bold uppercase ${
                                fraud.flag === 'NORMAL' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                              }`}>{fraud.flag}</span>
                            </div>
                          </div>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-500 dark:text-slate-400 font-mono text-xs">
                        {formatDate(claim.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState 
          icon={Activity} 
          title={t('finale.noClaimsFound')} 
          description="There are no claims filed against your company." 
        />
      )}
    </div>
  );
}
