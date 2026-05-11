import { Building2, Package, Briefcase, FileBarChart2, ShieldCheck, ShieldAlert, TrendingUp, AlertTriangle, ShieldX } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/formatDate';
import { cookies } from 'next/headers';
import { logout } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getCompanyData() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value ?? '';
    if (!token) return { status: 401 };

    const authHeader: HeadersInit = { Authorization: `Bearer ${token}` };

    const [productsRes, appsRes, claimsRes, policiesRes] = await Promise.all([
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

    if (appsRes?.status === 401 || claimsRes?.status === 401 || policiesRes?.status === 401) {
      return { status: 401 };
    }
    
    if (appsRes?.status === 403 || claimsRes?.status === 403 || policiesRes?.status === 403) {
      return { status: 403 };
    }

    const products = productsRes && productsRes.ok ? await productsRes.json() : [];
    const applications = appsRes && appsRes.ok ? await appsRes.json() : [];
    const claims = claimsRes && claimsRes.ok ? await claimsRes.json() : [];
    const policies = policiesRes && policiesRes.ok ? await policiesRes.json() : [];

    return { products, applications, claims, policies, status: 200 };
  } catch (error) {
    return { products: [], applications: [], claims: [], policies: [], status: 500 };
  }
}

export default async function CompanyDashboard() {
  const data = await getCompanyData();

  if (data.status === 401) {
    // This will trigger the logout effect in the layout or client components
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
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-zinc-400 max-w-md">Your account does not have permission to view the Company Admin workspace.</p>
      </div>
    );
  }

  const { products, applications, claims, policies } = data;

  // Calculate Metrics
  const activeProducts = products.length;
  const totalApps = applications.length;
  const activePolicies = policies.filter((p: any) => p.status === 'ACTIVE').length;
  const totalClaims = claims.length;
  const suspiciousClaims = claims.filter((c: any) => c.fraudAssessments?.[0]?.flag === 'SUSPICIOUS').length;
  
  const appsWithRisk = applications.filter((a: any) => a.riskAssessments?.length > 0);
  const avgRiskScore = appsWithRisk.length > 0 
    ? appsWithRisk.reduce((acc: number, a: any) => acc + a.riskAssessments[0].riskScore, 0) / appsWithRisk.length 
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Company Workspace</h1>
          <p className="text-zinc-400 mt-1">Dedicated tenant dashboard for portfolio and risk management.</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Scope: </span>
          <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <ShieldCheck className="w-4 h-4 mr-2" />
            Authenticated Tenant
          </span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-blue-400" />
            </div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Portfolio</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalApps}</p>
          <p className="text-xs text-zinc-500 mt-1">Total Applications</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Active</span>
          </div>
          <p className="text-2xl font-bold text-white">{activePolicies}</p>
          <p className="text-xs text-zinc-500 mt-1">In-Force Policies</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-rose-400" />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${suspiciousClaims > 0 ? 'text-rose-400 animate-pulse' : 'text-zinc-500'}`}>
              {suspiciousClaims} Flagged
            </span>
          </div>
          <p className="text-2xl font-bold text-white">{totalClaims}</p>
          <p className="text-xs text-zinc-500 mt-1">Total Claims Filed</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-amber-400" />
            </div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Risk Index</span>
          </div>
          <p className="text-2xl font-bold text-white">{avgRiskScore.toFixed(1)}</p>
          <p className="text-xs text-zinc-500 mt-1">Avg Risk Score</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Applications Pipeline Section */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Application Pipeline</h2>
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
                        <p className="text-[10px] text-zinc-500 uppercase font-bold">{app.product?.name}</p>
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
                {applications.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-zinc-500 italic">No applications found for this tenant.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Claims Monitor Section */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-400" />
            <h2 className="text-lg font-bold text-white">Claims Monitor</h2>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950 text-zinc-500 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-3">Claim Details</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Fraud Analysis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {claims.map((claim: any) => {
                  const fraud = claim.fraudAssessments?.[0];
                  return (
                    <tr key={claim.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-white">{claim.user?.firstName} {claim.user?.lastName}</p>
                        <p className="text-[10px] text-zinc-400 uppercase font-bold">{claim.application?.product?.name}</p>
                        <p className="text-[10px] text-zinc-500 mt-1 italic line-clamp-1">"{claim.description}"</p>
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
                {claims.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-zinc-500 italic">No claims filed.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Policy Portfolio Section */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl xl:col-span-2">
          <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Active Policy Portfolio</h2>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950 text-zinc-500 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-3">Policy Number</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Effective Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {policies.map((policy: any) => (
                  <tr key={policy.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-white uppercase">
                      {policy.policyNumber}
                    </td>
                    <td className="px-6 py-4 text-zinc-300 font-medium">
                      {policy.user?.firstName} {policy.user?.lastName}
                    </td>
                    <td className="px-6 py-4 text-zinc-400">
                      {policy.product?.name}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${
                        policy.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        'bg-zinc-800 text-zinc-500 border-zinc-700'
                      }`}>
                        {policy.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-500 font-mono text-xs">
                      {formatDate(policy.startDate)}
                    </td>
                  </tr>
                ))}
                {policies.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 italic">No active policies in portfolio.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
