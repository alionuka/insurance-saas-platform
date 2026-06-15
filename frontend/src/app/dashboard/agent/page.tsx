import { cookies } from 'next/headers';
import Link from 'next/link';
import {
  FileText,
  Activity,
  ShieldAlert,
  AlertTriangle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { formatDate } from '@/lib/formatDate';
import { getT } from '@/i18n/getT';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getAgentData() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value ?? '';
    const authHeader: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    const [appsRes, claimsRes] = await Promise.all([
      fetch(`${API_URL}/applications`, { 
        cache: 'no-store',
        headers: authHeader,
      }).catch(() => null),
      fetch(`${API_URL}/claims`, { 
        cache: 'no-store',
        headers: authHeader,
      }).catch(() => null),
    ]);

    const appsJson = appsRes && appsRes.ok ? await appsRes.json() : { items: [] };
    const claimsJson = claimsRes && claimsRes.ok ? await claimsRes.json() : { items: [] };

    const applications = appsJson.items ?? [];
    const claims = claimsJson.items ?? [];

    return { applications, claims };
  } catch {
    return { applications: [], claims: [] };
  }
}

export default async function AgentOverviewPage() {
  const { applications, claims } = await getAgentData();
  const { t } = await getT();

  const pendingApps = applications.filter((a: any) => a.status === 'PENDING').length;
  const openClaims = claims.filter((c: any) => c.status === 'FILED' || c.status === 'IN_PROGRESS').length;
  const highRiskApps = applications.filter((a: any) => a.riskAssessments?.[0]?.riskLevel === 'HIGH').length;
  const suspiciousClaims = claims.filter((c: any) => c.fraudAssessments?.[0]?.flag === 'SUSPICIOUS').length;

  let lowRisk = 0, medRisk = 0, highRisk = 0;
  applications.forEach((a: any) => {
    const level = a.riskAssessments?.[0]?.riskLevel;
    if (level === 'LOW') lowRisk++;
    else if (level === 'MEDIUM') medRisk++;
    else if (level === 'HIGH') highRisk++;
  });
  const totalRisk = lowRisk + medRisk + highRisk;

  const allActivity = [
    ...applications.map((a: any) => ({ ...a, type: 'APPLICATION', date: new Date(a.createdAt).getTime() })),
    ...claims.map((c: any) => ({ ...c, type: 'CLAIM', date: new Date(c.createdAt).getTime() }))
  ].sort((a, b) => b.date - a.date).slice(0, 10);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{t('dashboard.agentTitle')}</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">{t('dashboard.agentSubtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-5 w-5 text-blue-700" />
            <h3 className="font-medium text-slate-700 dark:text-slate-300">{t('dashboard.pendingApps')}</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{pendingApps}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
            <h3 className="font-medium text-slate-700 dark:text-slate-300">{t('dashboard.stats.openClaims')}</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{openClaims}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="h-5 w-5 text-rose-700 dark:text-rose-400" />
            <h3 className="font-medium text-slate-700 dark:text-slate-300">{t('tail.highRiskApps')}</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{highRiskApps}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-5 w-5 text-blue-700" />
            <h3 className="font-medium text-slate-700 dark:text-slate-300">{t('tail.suspiciousClaims')}</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{suspiciousClaims}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">{t('dashboard.recentActivity')}</h2>
          <div className="space-y-4">
            {allActivity.map((item: any) => (
              <div key={`${item.type}-${item.id}`} className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 dark:bg-[#060b1a]/50 border border-slate-200 dark:border-slate-800/50">
                <div className="h-10 w-10 rounded-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0">
                  {item.type === 'APPLICATION' ? <FileText className="h-5 w-5 text-blue-700" /> : <Activity className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {item.type === 'APPLICATION' ? 'New Application' : 'Claim Filed'}
                    </p>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatDate(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 truncate">
                    {item.type === 'APPLICATION' 
                      ? `${item.product?.name ?? 'Unknown'} • ${item.user?.firstName} ${item.user?.lastName}`
                      : `${item.description} • ${item.user?.firstName} ${item.user?.lastName}`}
                  </p>
                </div>
                <Link 
                  href={item.type === 'APPLICATION' ? `/dashboard/agent/applications?status=${item.status}` : `/dashboard/agent/claims/${item.id}`}
                  className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
            {allActivity.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">{t('dashboard.noActivity')}</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">{t('tail.riskDistribution')}</h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">{t('tail.lowRisk')}</span>
                <span className="text-slate-600 dark:text-slate-400">{lowRisk}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${totalRisk ? (lowRisk / totalRisk) * 100 : 0}%` }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-blue-700 font-medium">{t('tail.mediumRisk')}</span>
                <span className="text-slate-600 dark:text-slate-400">{medRisk}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-700" style={{ width: `${totalRisk ? (medRisk / totalRisk) * 100 : 0}%` }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-rose-700 dark:text-rose-400 font-medium">{t('tail.highRisk')}</span>
                <span className="text-slate-600 dark:text-slate-400">{highRisk}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500" style={{ width: `${totalRisk ? (highRisk / totalRisk) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
