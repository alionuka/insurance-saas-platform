import { Users, Server, Activity, Database, Zap, Shield, TrendingUp, Package, ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/formatDate';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getAdminData() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value ?? '';
    const authHeader: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    const [companiesRes, productsRes, appsRes, claimsRes] = await Promise.all([
      fetch(`${API_URL}/companies`, { cache: 'no-store' }).catch(() => null),
      fetch(`${API_URL}/products`, { cache: 'no-store' }).catch(() => null),
      fetch(`${API_URL}/applications`, { 
        cache: 'no-store',
        headers: authHeader,
      }).catch(() => null),
      fetch(`${API_URL}/claims`, { 
        cache: 'no-store',
        headers: authHeader,
      }).catch(() => null),
    ]);

    const companies = companiesRes && companiesRes.ok ? await companiesRes.json() : [];
    const products = productsRes && productsRes.ok ? await productsRes.json() : [];
    const applications = appsRes && appsRes.ok ? await appsRes.json() : [];
    const claims = claimsRes && claimsRes.ok ? await claimsRes.json() : [];

    return { companies, products, applications, claims };
  } catch (error) {
    return { companies: [], products: [], applications: [], claims: [] };
  }
}

export default async function AdminDashboard() {
  const { companies, products, applications, claims } = await getAdminData();

  // Aggregate Metrics
  const totalCompanies = companies.length;
  const totalProducts = products.length;
  const totalApps = applications.length;
  const totalClaims = claims.length;
  const suspiciousClaims = claims.filter((c: any) => c.fraudAssessments?.[0]?.flag === 'SUSPICIOUS').length;
  
  const uniqueUserIds = new Set(applications.map((a: any) => a.userId));
  const totalApplicants = uniqueUserIds.size;

  const appsWithRisk = applications.filter((a: any) => a.riskAssessments?.length > 0);
  const avgRiskScore = appsWithRisk.length > 0 
    ? appsWithRisk.reduce((acc: number, a: any) => acc + a.riskAssessments[0].riskScore, 0) / appsWithRisk.length 
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Platform Administration</h1>
        <p className="text-zinc-400 mt-1">Global system metrics and platform-wide monitoring.</p>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Companies</span>
            <Database className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="text-xl font-bold text-white">{totalCompanies}</p>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Applicants</span>
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
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Claims</span>
            <Activity className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-xl font-bold text-white">{totalClaims}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Suspicious</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-xl font-bold text-rose-400">{suspiciousClaims}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Avg Risk</span>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-white">{avgRiskScore.toFixed(1)}</p>
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
