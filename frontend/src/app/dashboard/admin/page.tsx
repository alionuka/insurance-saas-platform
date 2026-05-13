import { Users, Server, Activity, Database, Zap, Shield, TrendingUp, Package, ShieldCheck, ShieldAlert, AlertTriangle, UserPlus, ShieldX, ScrollText } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/formatDate';
import { cookies } from 'next/headers';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getAdminData() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value ?? '';
    if (!token) return { status: 401 };

    const authHeader: HeadersInit = { Authorization: `Bearer ${token}` };

    const [companiesRes, productsRes, appsRes, claimsRes, policiesRes] = await Promise.all([
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
    ]);

    if (companiesRes?.status === 401 || appsRes?.status === 401 || claimsRes?.status === 401) {
      return { status: 401 };
    }
    
    if (companiesRes?.status === 403 || appsRes?.status === 403 || claimsRes?.status === 403) {
      return { status: 403 };
    }

    const companies = companiesRes && companiesRes.ok ? await companiesRes.json() : [];
    const products = productsRes && productsRes.ok ? await productsRes.json() : [];
    const applications = appsRes && appsRes.ok ? await appsRes.json() : [];
    const claims = claimsRes && claimsRes.ok ? await claimsRes.json() : [];
    const policies = policiesRes && policiesRes.ok ? await policiesRes.json() : [];

    return { companies, products, applications, claims, policies, status: 200 };
  } catch (error) {
    return { companies: [], products: [], applications: [], claims: [], policies: [], status: 500 };
  }
}

export default async function AdminDashboard() {
  const data = await getAdminData();

  if (data.status === 401) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        <p className="mt-4 text-zinc-400">Session expired. Redirecting...</p>
      </div>
    );
  }

  if (data.status === 403) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 border-2 border-dashed border-rose-900/30 rounded-3xl bg-rose-950/10 text-center">
        <ShieldX className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
        <p className="text-zinc-400 max-w-md">Platform administration is restricted to authorized personnel only.</p>
      </div>
    );
  }

  const { companies, products, applications, claims, policies } = data;

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

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Platform Administration</h1>
          <p className="text-zinc-400 mt-1">Global system metrics and platform-wide monitoring.</p>
        </div>
      </div>
      
      {/* Navigation Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link 
          href="/dashboard/admin/users"
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
              <UserPlus className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Manage Users</p>
              <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-tight">Create new staff accounts</p>
            </div>
          </div>
        </Link>

        <Link 
          href="/dashboard/admin/audit-logs"
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-zinc-500/10 border border-zinc-500/20 flex items-center justify-center group-hover:bg-zinc-500/20 transition-colors">
              <ScrollText className="h-5 w-5 text-zinc-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Audit Log</p>
              <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-tight">Compliance event history</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Tenants</span>
            <Database className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="text-xl font-bold text-white">{totalCompanies}</p>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Users</span>
            <Users className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-white">{totalApplicants}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Products</span>
            <Package className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-xl font-bold text-white">{totalProducts}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Apps</span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-white">{totalApps}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Policies</span>
            <ShieldCheck className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-xl font-bold text-white">{totalPolicies}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Claims</span>
            <Activity className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-xl font-bold text-white">{totalClaims}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Flagged</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-xl font-bold text-rose-400">{suspiciousClaims}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Companies Section */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-2">
            <Database className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Platform Tenants</h2>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950 text-zinc-500 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-3">Company Details</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3 text-right">Products</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {companies.map((company: any) => (
                  <tr key={company.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-indigo-400">
                          {company.name.substring(0, 2).toUpperCase()}
                        </div>
                        <p className="font-bold text-white">{company.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-zinc-400 line-clamp-1">{company.description || "No description provided."}</p>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-zinc-300">
                      {products.filter((p: any) => p.companyId === company.id).length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Platform Applications Section */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Global Application Pipeline</h2>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950 text-zinc-500 uppercase text-[10px] font-bold tracking-wider">
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
                    <tr key={app.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-white">{app.user?.firstName} {app.user?.lastName}</p>
                        <p className="text-[10px] text-zinc-500 uppercase font-bold">{app.product?.name} <span className="text-zinc-700 mx-1">/</span> {app.product?.company?.name}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${
                          app.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                          app.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {risk ? (
                          <div className="flex flex-col items-end">
                            <span className="font-mono font-bold text-white">{risk.riskScore.toFixed(1)}</span>
                            <span className={`text-[9px] font-bold uppercase ${
                              risk.riskLevel === 'LOW' ? 'text-emerald-400' : 
                              risk.riskLevel === 'HIGH' ? 'text-rose-400' : 'text-amber-400'
                            }`}>{risk.riskLevel}</span>
                          </div>
                        ) : <span className="text-zinc-700">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Platform Claims Section */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl xl:col-span-2">
          <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-400" />
            <h2 className="text-lg font-bold text-white">Global Claims Monitor</h2>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950 text-zinc-500 uppercase text-[10px] font-bold tracking-wider">
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
                    <tr key={claim.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4 max-w-xs">
                        <p className="font-bold text-white">{claim.user?.firstName} {claim.user?.lastName}</p>
                        <p className="text-[10px] text-zinc-400 uppercase font-bold">{claim.application?.product?.name}</p>
                        <p className="text-xs text-zinc-500 line-clamp-1 italic mt-1">"{claim.description}"</p>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-white">
                        {formatCurrency(claim.amount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${
                          claim.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                          claim.status === 'DENIED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                          'bg-zinc-800 text-zinc-500 border-zinc-700'
                        }`}>
                          {claim.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {fraud ? (
                          <div className="flex flex-col items-end">
                            <span className="font-mono font-bold text-white">{fraud.fraudScore.toFixed(1)}</span>
                            <div className="flex items-center gap-1">
                              {fraud.flag === 'SUSPICIOUS' && <AlertTriangle className="h-3 w-3 text-rose-400" />}
                              <span className={`text-[9px] font-bold uppercase ${
                                fraud.flag === 'NORMAL' ? 'text-emerald-400' : 'text-rose-400'
                              }`}>{fraud.flag}</span>
                            </div>
                          </div>
                        ) : <span className="text-zinc-700">—</span>}
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
