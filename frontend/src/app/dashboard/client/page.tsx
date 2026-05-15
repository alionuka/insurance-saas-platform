import { ShieldCheck, FileCheck, Activity, CreditCard, Clock, ChevronRight } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/formatDate';
import { cookies } from 'next/headers';
import Link from 'next/link';

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
        <h1 className="text-3xl font-bold tracking-tight text-white">Welcome back</h1>
        <p className="text-zinc-400 mt-1">Here is an overview of your insurance portfolio.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <FileCheck className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Applications</p>
            <p className="text-2xl font-bold text-white">{applications.length}</p>
          </div>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <ShieldCheck className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Active Policies</p>
            <p className="text-2xl font-bold text-white">{activePolicies.length}</p>
          </div>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
            <Activity className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Open Claims</p>
            <p className="text-2xl font-bold text-white">{openClaims.length}</p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <CreditCard className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Total Premium</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(totalPremium)}</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-zinc-400" />
          <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          {recentActivity.length > 0 ? (
            <div className="divide-y divide-zinc-800">
              {recentActivity.map((item) => (
                <Link key={`${item.type}-${item.id}`} href={item.href} className="block group">
                  <div className="p-4 sm:p-5 flex items-center justify-between hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0 group-hover:border-zinc-700 transition-colors">
                        {item.type === 'APPLICATION' && <FileCheck className="h-4 w-4 text-indigo-400" />}
                        {item.type === 'POLICY' && <ShieldCheck className="h-4 w-4 text-blue-400" />}
                        {item.type === 'CLAIM' && <Activity className="h-4 w-4 text-emerald-400" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{item.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-zinc-500 truncate">{item.subtitle}</p>
                          <span className="text-[10px] text-zinc-600">•</span>
                          <p className="text-xs text-zinc-500 shrink-0">{formatDate(item.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 pl-4">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border bg-zinc-950 text-zinc-400 border-zinc-800">
                        {item.status.replace('_', ' ')}
                      </span>
                      <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-zinc-500 text-sm">No recent activity found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
