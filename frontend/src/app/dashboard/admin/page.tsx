import { Users, Server, Activity, Database, Zap, Shield, TrendingUp, Package, ShieldCheck, ShieldAlert, AlertTriangle, UserPlus, ShieldX, ScrollText } from 'lucide-react';
import { getT } from '@/i18n/getT';
import { formatDate, formatCurrency } from '@/lib/formatDate';
import { cookies } from 'next/headers';
import Link from 'next/link';
import StatusPieChart from '@/components/charts/StatusPieChart';
import ActivityLineChart from '@/components/charts/ActivityLineChart';
import CountUpNumber from '@/components/charts/CountUpNumber';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getAdminData() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value ?? '';
    if (!token) return { status: 401 };

    const authHeader: HeadersInit = { Authorization: `Bearer ${token}` };

    const [companiesRes, productsRes, appsRes, claimsRes, policiesRes, auditRes] = await Promise.all([
      fetch(`${API_URL}/companies`, { 
        cache: 'no-store',
        headers: authHeader,
      }).catch(() => null),
      fetch(`${API_URL}/products`, { cache: 'no-store' }).catch(() => null),
      fetch(`${API_URL}/applications`, { 
        cache: 'no-store',
        headers: authHeader,
      }).catch(() => null),
      fetch(`${API_URL}/claims`, { 
        cache: 'no-store',
        headers: authHeader,
      }).catch(() => null),
      fetch(`${API_URL}/policies`, { 
        cache: 'no-store',
        headers: authHeader,
      }).catch(() => null),
      // Backend currently caps limit at 200 (see ListAuditLogsDto). Request the
      // max — that's enough for ~20 days at ~10 events/day to populate the chart.
      fetch(`${API_URL}/audit-logs?limit=200`, {
        cache: 'no-store',
        headers: authHeader,
      }).catch(() => null),
    ]);

    if (companiesRes?.status === 401 || appsRes?.status === 401 || claimsRes?.status === 401) {
      return { status: 401 };
    }
    
    if (companiesRes?.status === 403 || appsRes?.status === 403 || claimsRes?.status === 403) {
      return { status: 403 };
    }

    const companiesJson = companiesRes && companiesRes.ok ? await companiesRes.json() : { items: [] };
    const productsJson = productsRes && productsRes.ok ? await productsRes.json() : { items: [] };
    const appsJson = appsRes && appsRes.ok ? await appsRes.json() : { items: [] };
    const claimsJson = claimsRes && claimsRes.ok ? await claimsRes.json() : { items: [] };
    const policiesJson = policiesRes && policiesRes.ok ? await policiesRes.json() : { items: [] };
    const auditJson = auditRes && auditRes.ok ? await auditRes.json() : { items: [] };

    const companies = companiesJson.items ?? [];
    const products = productsJson.items ?? [];
    const applications = appsJson.items ?? [];
    const claims = claimsJson.items ?? [];
    const policies = policiesJson.items ?? [];
    const auditLogs = auditJson.items ?? [];

    return { companies, products, applications, claims, policies, auditLogs, status: 200 };
  } catch (error) {
    return { companies: [], products: [], applications: [], claims: [], policies: [], auditLogs: [], status: 500 };
  }
}

export default async function AdminDashboard() {
  const data = await getAdminData();
  const { t } = await getT();

  if (data.status === 401) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
        <p className="mt-4 text-slate-600 dark:text-slate-400">Session expired. Redirecting...</p>
      </div>
    );
  }

  if (data.status === 403) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 border-2 border-dashed border-rose-900/30 rounded-3xl bg-rose-950/10 text-center">
        <ShieldX className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Access Restricted</h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-md">Platform administration is restricted to authorized personnel only.</p>
      </div>
    );
  }

  const { companies, products, applications, claims, policies, auditLogs } = data;

  // Aggregate Metrics
  const totalCompanies = companies.length;
  const totalProducts = products.length;
  const totalApps = applications.length;
  const totalClaims = claims.length;
  const totalPolicies = policies.length;
  const suspiciousClaims = claims.filter((c: any) => c.fraudAssessments?.[0]?.flag === 'SUSPICIOUS').length;
  
  const uniqueUserIds = new Set(applications.map((a: any) => a.userId));
  const totalApplicants = uniqueUserIds.size;

  const appsWithRisk = applications.filter((a: any) => a.riskAssessments?.length > 0);
  const avgRiskScore = appsWithRisk.length > 0 
    ? appsWithRisk.reduce((acc: number, a: any) => acc + a.riskAssessments[0].riskScore, 0) / appsWithRisk.length 
    : 0;

  // Chart data: Applications by Status
  const appStatusCounts = applications.reduce((acc: any, a: any) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {});
  const appsPieData = [
    { name: 'Pending', value: appStatusCounts['PENDING'] || 0, color: '#60a5fa' },
    { name: 'Approved', value: appStatusCounts['APPROVED'] || 0, color: '#34d399' },
    { name: 'Rejected', value: appStatusCounts['REJECTED'] || 0, color: '#fb7185' },
    { name: 'Under Review', value: appStatusCounts['UNDER_REVIEW'] || 0, color: '#60a5fa' },
  ];

  // Chart data: Claims by Status
  const claimStatusCounts = claims.reduce((acc: any, c: any) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {});
  const claimsPieData = [
    { name: 'Filed', value: claimStatusCounts['FILED'] || 0, color: '#60a5fa' },
    { name: 'In Progress', value: claimStatusCounts['IN_PROGRESS'] || 0, color: '#60a5fa' },
    { name: 'Approved', value: claimStatusCounts['APPROVED'] || 0, color: '#34d399' },
    { name: 'Denied', value: claimStatusCounts['DENIED'] || 0, color: '#fb7185' },
  ];

  // Chart data: Policies by Status
  const policyStatusCounts = policies.reduce((acc: any, p: any) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc; }, {});
  const policiesPieData = [
    { name: 'Active', value: policyStatusCounts['ACTIVE'] || 0, color: '#34d399' },
    { name: 'Pending Payment', value: policyStatusCounts['PENDING_PAYMENT'] || 0, color: '#60a5fa' },
    { name: 'Expired', value: policyStatusCounts['EXPIRED'] || 0, color: '#71717a' },
    { name: 'Cancelled', value: policyStatusCounts['CANCELLED'] || 0, color: '#fb7185' },
  ];

  // Chart data: Activity over last 30 days
  const now = new Date();
  const activityData: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
    const count = (auditLogs || []).filter((l: any) => l.createdAt?.slice(0, 10) === key).length;
    activityData.push({ date: label, count });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{t('dashboard.adminTitle')}</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">{t('dashboard.adminSubtitle')}</p>
        </div>
      </div>
      
      {/* Navigation Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link 
          href="/dashboard/admin/users"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-blue-700/10 border border-blue-700/20 flex items-center justify-center group-hover:bg-blue-700/20 transition-colors">
              <UserPlus className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Manage Users</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-tight">Create new staff accounts</p>
            </div>
          </div>
        </Link>

        <Link 
          href="/dashboard/admin/audit-logs"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-zinc-500/10 border border-zinc-500/20 flex items-center justify-center group-hover:bg-zinc-500/20 transition-colors">
              <ScrollText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Audit Log</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-tight">Compliance event history</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Tenants</span>
            <Database className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100"><CountUpNumber value={totalCompanies} /></p>
        </div>
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Users</span>
            <Users className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100"><CountUpNumber value={totalApplicants} /></p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Products</span>
            <Package className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100"><CountUpNumber value={totalProducts} /></p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Apps</span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100"><CountUpNumber value={totalApps} /></p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Policies</span>
            <ShieldCheck className="h-4 w-4 text-blue-700" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100"><CountUpNumber value={totalPolicies} /></p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Claims</span>
            <Activity className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100"><CountUpNumber value={totalClaims} /></p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400 tracking-wider">Flagged</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-xl font-bold text-rose-700 dark:text-rose-400"><CountUpNumber value={suspiciousClaims} /></p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StatusPieChart data={appsPieData} title="Applications by Status" />
        <StatusPieChart data={claimsPieData} title="Claims by Status" />
        <StatusPieChart data={policiesPieData} title="Policies by Status" />
      </div>

      {/* Activity Line Chart */}
      <ActivityLineChart data={activityData} title="Platform Activity — Last 30 Days" />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Companies Section */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-700" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Platform Tenants</h2>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-[#060b1a] text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-3">Company Details</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3 text-right">Products</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {companies.map((company: any) => (
                  <tr key={company.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-blue-700">
                          {company.name.substring(0, 2).toUpperCase()}
                        </div>
                        <p className="font-bold text-slate-900 dark:text-slate-100">{company.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">{company.description || "No description provided."}</p>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                      {products.filter((p: any) => p.companyId === company.id).length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Platform Applications Section */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Global Application Pipeline</h2>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-[#060b1a] text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-3">Customer & Product</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Risk Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {applications.map((app: any) => {
                  const risk = app.riskAssessments?.[0];
                  return (
                    <tr key={app.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 dark:text-slate-100">{app.user?.firstName} {app.user?.lastName}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">{app.product?.name} <span className="text-slate-300 mx-1">/</span> {app.product?.company?.name}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${
                          app.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' : 
                          app.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20' : 
                          'bg-blue-700/10 text-blue-700 border-blue-700/20'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {risk ? (
                          <div className="flex flex-col items-end">
                            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{risk.riskScore.toFixed(1)}</span>
                            <span className={`text-[9px] font-bold uppercase ${
                              risk.riskLevel === 'LOW' ? 'text-emerald-700 dark:text-emerald-400' : 
                              risk.riskLevel === 'HIGH' ? 'text-rose-700 dark:text-rose-400' : 'text-blue-700'
                            }`}>{risk.riskLevel}</span>
                          </div>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Platform Claims Section */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl xl:col-span-2">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-700 dark:text-rose-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Global Claims Monitor</h2>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-[#060b1a] text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-3">Customer & Claim Info</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Fraud Analysis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {claims.map((claim: any) => {
                  const fraud = claim.fraudAssessments?.[0];
                  return (
                    <tr key={claim.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 max-w-xs">
                        <p className="font-bold text-slate-900 dark:text-slate-100">{claim.user?.firstName} {claim.user?.lastName}</p>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold">{claim.application?.product?.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 italic mt-1">"{claim.description}"</p>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(claim.amount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${
                          claim.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' : 
                          claim.status === 'DENIED' ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20' : 
                          'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                        }`}>
                          {claim.status}
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
