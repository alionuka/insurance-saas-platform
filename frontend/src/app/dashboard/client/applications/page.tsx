import { cookies } from 'next/headers';
import { FileCheck, TrendingUp, AlertCircle, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/formatDate';
import EmptyState from '@/components/ui/EmptyState';
import ApplicationFilters from './ApplicationFilters';
import Link from 'next/link';
import { getT } from '@/i18n/getT';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getApplications() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value ?? '';
    const authHeader: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    const res = await fetch(`${API_URL}/applications`, { 
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

export default async function ClientApplicationsPage(props: Props) {
  const searchParams = await props.searchParams;
  const statusFilter = typeof searchParams.status === 'string' ? searchParams.status : 'all';

  const allApplications = await getApplications();
  const { t } = await getT();
  
  const counts = allApplications.reduce((acc: any, app: any) => {
    acc['all'] = (acc['all'] || 0) + 1;
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, { all: 0 });

  const applications = statusFilter === 'all' 
    ? allApplications 
    : allApplications.filter((a: any) => a.status === statusFilter);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">{t('clientApps.title')}</h1>
        <p className="text-zinc-400 mt-1 text-sm">{t('clientApps.subtitle')}</p>
      </div>

      <ApplicationFilters counts={counts} />

      <div className="grid gap-4">
        {applications.length > 0 ? (
          applications.map((app: any) => {
            const risk = app.riskAssessments?.[0];
            return (
              <Link href={`/dashboard/client/applications/${app.id}`} key={app.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors block group">
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-zinc-800 flex items-center justify-center border border-zinc-700 flex-shrink-0">
                      <FileCheck className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{app.product?.name || t('clientApps.unknownProduct')}</h3>
                      <p className="text-sm text-emerald-400 font-medium">{app.product?.company?.name || t('clientApps.unknownCompany')}</p>
                      <p className="text-xs text-zinc-500 mt-1 italic">{t('clientApps.applicationId')}: {app.id.substring(0, 8)} • {t('clientApps.submitted')}: {formatDate(app.createdAt)}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider border ${
                      app.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                      app.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                      'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                </div>

                {/* Risk Assessment Info */}
                {risk && (
                  <div className="px-5 pb-5 pt-0 border-t border-zinc-800/50 bg-zinc-950/30">
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-1 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="h-3 w-3 text-zinc-500" />
                          <span className="text-[10px] text-zinc-500 uppercase font-bold">{t('clientApps.riskScore')}</span>
                        </div>
                        <p className="text-lg font-mono font-bold text-white">{risk.riskScore.toFixed(1)}<span className="text-xs text-zinc-500 ml-1">/ 100</span></p>
                      </div>
                      <div className="md:col-span-1 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="h-3 w-3 text-zinc-500" />
                          <span className="text-[10px] text-zinc-500 uppercase font-bold">{t('clientApps.riskLevel')}</span>
                        </div>
                        <p className={`text-lg font-bold ${
                          risk.riskLevel === 'LOW' ? 'text-emerald-400' : 
                          risk.riskLevel === 'HIGH' ? 'text-rose-400' : 'text-amber-400'
                        }`}>{risk.riskLevel}</p>
                      </div>
                      <div className="md:col-span-2 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="h-3 w-3 text-zinc-500" />
                          <span className="text-[10px] text-zinc-500 uppercase font-bold">{t('clientApps.mlExplanation')}</span>
                        </div>
                        <p className="text-xs text-zinc-400 italic leading-relaxed">"{risk.explanation}"</p>
                      </div>
                    </div>
                  </div>
                )}
              </Link>
            );
          })
        ) : (
          <EmptyState
            icon={FileCheck}
            title={t('clientApps.emptyTitle')}
            description={t('clientApps.emptyHint')}
            action={{ label: t('clientApps.emptyAction'), href: '/' }}
          />
        )}
      </div>
    </div>
  );
}
