import { ShieldCheck, FileCheck, Activity, CreditCard, Clock, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/formatDate';
import { cookies } from 'next/headers';
import Link from 'next/link';
import CountUpNumber from '@/components/charts/CountUpNumber';
import { getT } from '@/i18n/getT';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getClientData() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value ?? '';
    const authHeader: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    const [appsRes, claimsRes, policiesRes] = await Promise.all([
      fetch(`${API_URL}/applications`, { cache: 'no-store', headers: authHeader }).catch(() => null),
      fetch(`${API_URL}/claims`, { cache: 'no-store', headers: authHeader }).catch(() => null),
      fetch(`${API_URL}/policies`, { cache: 'no-store', headers: authHeader }).catch(() => null),
    ]);

    const appsJson = appsRes && appsRes.ok ? await appsRes.json() : { items: [] };
    const claimsJson = claimsRes && claimsRes.ok ? await claimsRes.json() : { items: [] };
    const policiesJson = policiesRes && policiesRes.ok ? await policiesRes.json() : { items: [] };

    return {
      applications: appsJson.items ?? [],
      claims: claimsJson.items ?? [],
      policies: policiesJson.items ?? [],
    };
  } catch (error) {
    return { applications: [], claims: [], policies: [] };
  }
}

export default async function ClientDashboardOverview() {
  const { applications, claims, policies } = await getClientData();
  const { t } = await getT();

  const activePolicies = policies.filter((p: any) => p.status === 'ACTIVE');
  const openClaims = claims.filter((c: any) => c.status === 'FILED' || c.status === 'IN_PROGRESS');
  const totalPremium = activePolicies.reduce((sum: number, p: any) => sum + (p.premiumAmount || 0), 0);

  // Combine and sort recent activity
  const allItems = [
    ...applications.map((a: any) => ({
      id: a.id,
      type: 'APPLICATION',
      title: a.product?.name || 'Application',
      subtitle: a.product?.company?.name || 'Unknown',
      status: a.status,
      createdAt: a.createdAt,
      href: '/dashboard/client/applications',
    })),
    ...policies.map((p: any) => ({
      id: p.id,
      type: 'POLICY',
      title: p.product?.name || 'Policy',
      subtitle: `Policy #${p.policyNumber}`,
      status: p.status,
      createdAt: p.createdAt,
      href: `/dashboard/client/policies/${p.id}`,
    })),
    ...claims.map((c: any) => ({
      id: c.id,
      type: 'CLAIM',
      title: c.application?.product?.name || 'Claim',
      subtitle: c.description || 'No description',
      status: c.status,
      createdAt: c.createdAt,
      href: `/dashboard/client/claims/${c.id}`,
    })),
  ];

  const recentActivity = allItems
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{t('dashboard.welcomeBack')}</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">{t('dashboard.overviewSubtitle')}</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-700/10 flex items-center justify-center border border-blue-700/20">
            <FileCheck className="h-6 w-6 text-blue-700" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{t('dashboard.stats.applications')}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100"><CountUpNumber value={applications.length} /></p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-700/10 flex items-center justify-center border border-blue-700/20">
            <ShieldCheck className="h-6 w-6 text-blue-700" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{t('dashboard.stats.activePolicies')}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100"><CountUpNumber value={activePolicies.length} /></p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-700/10 flex items-center justify-center border border-blue-700/20">
            <Activity className="h-6 w-6 text-blue-700" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{t('dashboard.stats.openClaims')}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100"><CountUpNumber value={openClaims.length} /></p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <CreditCard className="h-6 w-6 text-emerald-700 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{t('dashboard.stats.totalPremium')}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100"><CountUpNumber value={Math.round(totalPremium)} prefix="$" /></p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{t('dashboard.recentActivity')}</h2>
        </div>
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          {recentActivity.length > 0 ? (
            <div className="divide-y divide-zinc-800">
              {recentActivity.map((item) => (
                <Link key={`${item.type}-${item.id}`} href={item.href} className="block group">
                  <div className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-slate-50 dark:bg-[#060b1a] border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 group-hover:border-slate-300 transition-colors">
                        {item.type === 'APPLICATION' && <FileCheck className="h-4 w-4 text-blue-700" />}
                        {item.type === 'POLICY' && <ShieldCheck className="h-4 w-4 text-blue-700" />}
                        {item.type === 'CLAIM' && <Activity className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{item.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.subtitle}</p>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">•</span>
                          <p className="text-xs text-slate-500 dark:text-slate-400 shrink-0">{formatDate(item.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 pl-4">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border bg-slate-50 dark:bg-[#060b1a] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800">
                        {item.status.replace('_', ' ')}
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-slate-500 dark:text-slate-400 text-sm">{t('dashboard.noActivity')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
