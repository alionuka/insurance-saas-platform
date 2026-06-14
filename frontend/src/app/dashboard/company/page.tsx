import { Building2, Package, Briefcase, FileBarChart2, ShieldCheck, ShieldAlert, TrendingUp, AlertTriangle, ShieldX } from 'lucide-react';
import { getT } from '@/i18n/getT';
import { formatDate, formatCurrency } from '@/lib/formatDate';
import { cookies } from 'next/headers';
import { logout } from '@/lib/auth';
import Link from 'next/link';
import StatusPieChart from '@/components/charts/StatusPieChart';
import ActivityLineChart from '@/components/charts/ActivityLineChart';
import CountUpNumber from '@/components/charts/CountUpNumber';
import TopRiskDriversChart, { RiskDriver } from '@/components/charts/TopRiskDriversChart';
import TopFraudDriversChart, { FraudDriver } from '@/components/charts/TopFraudDriversChart';
import ProductPerformanceTable, { ProductRow } from '@/components/charts/ProductPerformanceTable';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getCompanyData() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value ?? '';
    if (!token) return { status: 401 };

    const authHeader: HeadersInit = { Authorization: `Bearer ${token}` };

    const [productsRes, appsRes, claimsRes, policiesRes, meRes] =
      await Promise.all([
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
        fetch(`${API_URL}/auth/me`, {
          cache: 'no-store',
          headers: authHeader,
        }).catch(() => null),
      ]);
    const meJson = meRes && meRes.ok ? await meRes.json() : null;
    const tenantStatus: 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | null =
      meJson?.company?.status ?? null;

    if (appsRes?.status === 401 || claimsRes?.status === 401 || policiesRes?.status === 401) {
      return { status: 401 };
    }
    
    if (appsRes?.status === 403 || claimsRes?.status === 403 || policiesRes?.status === 403) {
      return { status: 403 };
    }

    const productsJson = productsRes && productsRes.ok ? await productsRes.json() : { items: [] };
    const appsJson = appsRes && appsRes.ok ? await appsRes.json() : { items: [] };
    const claimsJson = claimsRes && claimsRes.ok ? await claimsRes.json() : { items: [] };
    const policiesJson = policiesRes && policiesRes.ok ? await policiesRes.json() : { items: [] };

    const products = productsJson.items ?? [];
    const applications = appsJson.items ?? [];
    const claims = claimsJson.items ?? [];
    const policies = policiesJson.items ?? [];

    return {
      products,
      applications,
      claims,
      policies,
      tenantStatus,
      status: 200,
    };
  } catch {
    return {
      products: [],
      applications: [],
      claims: [],
      policies: [],
      tenantStatus: null,
      status: 500,
    };
  }
}

export default async function CompanyDashboard() {
  const data = await getCompanyData();
  const { t } = await getT();

  if (data.status === 401) {
    // This will trigger the logout effect in the layout or client components
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
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

  // Chart data: Policies by Status
  const policyStatusCounts = policies.reduce((acc: any, p: any) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc; }, {});
  const policiesPieData = [
    { name: 'Active', value: policyStatusCounts['ACTIVE'] || 0, color: '#34d399' },
    { name: 'Pending Payment', value: policyStatusCounts['PENDING_PAYMENT'] || 0, color: '#2dd4bf' },
    { name: 'Expired', value: policyStatusCounts['EXPIRED'] || 0, color: '#71717a' },
    { name: 'Cancelled', value: policyStatusCounts['CANCELLED'] || 0, color: '#fb7185' },
  ];

  // Chart data: Claims by Status
  const claimStatusCounts = claims.reduce((acc: any, c: any) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {});
  const claimsPieData = [
    { name: 'Filed', value: claimStatusCounts['FILED'] || 0, color: '#60a5fa' },
    { name: 'In Progress', value: claimStatusCounts['IN_PROGRESS'] || 0, color: '#2dd4bf' },
    { name: 'Approved', value: claimStatusCounts['APPROVED'] || 0, color: '#34d399' },
    { name: 'Denied', value: claimStatusCounts['DENIED'] || 0, color: '#fb7185' },
  ];

  // Chart data: Monthly Premium Revenue (last 6 months)
  const now = new Date();
  const revenueData: { date: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = d.toISOString().slice(0, 7); // 'YYYY-MM'
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    const monthPolicies = policies.filter((p: any) => p.createdAt?.slice(0, 7) === monthKey);
    const total = monthPolicies.reduce((sum: number, p: any) => sum + (p.premiumAmount || 0), 0);
    revenueData.push({ date: label, count: Math.round(total) });
  }

  // BI: Risk Level Distribution across all assessed apps
  const riskLevelCounts = appsWithRisk.reduce((acc: any, a: any) => {
    const lvl = a.riskAssessments[0].riskLevel;
    acc[lvl] = (acc[lvl] || 0) + 1;
    return acc;
  }, {});
  const riskLevelPieData = [
    { name: 'Low', value: riskLevelCounts['LOW'] || 0, color: '#34d399' },
    { name: 'Medium', value: riskLevelCounts['MEDIUM'] || 0, color: '#2dd4bf' },
    { name: 'High', value: riskLevelCounts['HIGH'] || 0, color: '#fb7185' },
  ];

  // BI: Top Risk Drivers — aggregate SHAP feature contributions across all assessed apps
  const driverMap = new Map<string, { totalImpact: number; occurrences: number }>();
  for (const app of applications) {
    const fc = app.riskAssessments?.[0]?.featureContributions;
    if (!Array.isArray(fc)) continue;
    for (const f of fc) {
      const cur = driverMap.get(f.feature) ?? { totalImpact: 0, occurrences: 0 };
      cur.totalImpact += Math.abs(f.contribution ?? 0);
      cur.occurrences += 1;
      driverMap.set(f.feature, cur);
    }
  }
  const topRiskDrivers: RiskDriver[] = Array.from(driverMap.entries())
    .map(([feature, stats]) => ({ feature, ...stats }))
    .sort((a, b) => b.totalImpact - a.totalImpact)
    .slice(0, 5);

  // BI: Top Fraud Drivers — aggregate SHAP feature contributions across fraud assessments
  const fraudDriverMap = new Map<string, { totalImpact: number; occurrences: number }>();
  for (const claim of claims) {
    const fc = claim.fraudAssessments?.[0]?.featureContributions;
    if (!Array.isArray(fc)) continue;
    for (const f of fc) {
      const cur = fraudDriverMap.get(f.feature) ?? { totalImpact: 0, occurrences: 0 };
      cur.totalImpact += Math.abs(f.contribution ?? 0);
      cur.occurrences += 1;
      fraudDriverMap.set(f.feature, cur);
    }
  }
  const topFraudDrivers: FraudDriver[] = Array.from(fraudDriverMap.entries())
    .map(([feature, stats]) => ({ feature, ...stats }))
    .sort((a, b) => b.totalImpact - a.totalImpact)
    .slice(0, 5);

  // BI: Performance per Product — only this company's products
  const myCompanyProducts = products.filter((p: any) =>
    applications.some((a: any) => a.productId === p.id) ||
    policies.some((pol: any) => pol.productId === p.id)
  );
  const productPerformance: ProductRow[] = myCompanyProducts.map((p: any) => {
    const productApps = applications.filter((a: any) => a.productId === p.id);
    const productPolicies = policies.filter((pol: any) => pol.productId === p.id);
    const activePol = productPolicies.filter((pol: any) => pol.status === 'ACTIVE');
    const productClaims = claims.filter((c: any) =>
      c.application?.productId === p.id || c.policy?.productId === p.id
    );
    const approvedClaims = productClaims.filter((c: any) => c.status === 'APPROVED');
    const premiumRevenue = activePol.reduce((sum: number, pol: any) => sum + (pol.premiumAmount || 0), 0);
    return {
      productId: p.id,
      productName: p.name,
      productType: p.type,
      appsCount: productApps.length,
      policiesActive: activePol.length,
      premiumRevenue,
      claimsCount: productClaims.length,
      approvedClaims: approvedClaims.length,
      claimsRatio: activePol.length > 0 ? approvedClaims.length / activePol.length : 0,
    };
  });

  return (
    <div className="space-y-8">
      {/* KYC review banner — only renders for tenants still in
          PENDING_VERIFICATION. Soft block: dashboard is browsable but the
          banner makes clear that product creation, application approvals
          and policy issuance are gated until platform admin sign-off. */}
      {data.tenantStatus === 'PENDING_VERIFICATION' && (
        <div className="bg-teal-500/5 border border-teal-500/30 rounded-xl p-5 flex items-start gap-4">
          <div className="h-10 w-10 rounded-full bg-teal-500/15 border border-teal-500/30 flex items-center justify-center shrink-0">
            <ShieldAlert className="h-5 w-5 text-teal-400" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-teal-300">
              Your tenant is awaiting verification
            </h2>
            <p className="text-sm text-teal-200/70 mt-1 leading-relaxed">
              A platform administrator is reviewing your KYC submission. You
              can browse the dashboard, but product creation and policy
              activation are disabled until your tenant is marked{' '}
              <span className="font-bold text-teal-300">ACTIVE</span>. This
              usually takes 1–3 business days in production; for the thesis
              demo a platform admin can approve you instantly from{' '}
              <span className="font-mono text-[11px] bg-teal-500/10 px-1 py-0.5 rounded">
                /dashboard/admin/companies
              </span>
              .
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{t('dashboard.companyTitle')}</h1>
          <p className="text-zinc-400 mt-1">{t('dashboard.companySubtitle')}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Scope: </span>
          <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <ShieldCheck className="w-4 h-4 mr-2" />
            Authenticated Tenant
          </span>
        </div>
      </div>

      {/* Navigation Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link 
          href="/dashboard/company/products"
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center group-hover:bg-teal-500/20 transition-colors">
              <Package className="h-5 w-5 text-teal-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Manage Products</p>
              <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-tight">Catalog & Pricing</p>
            </div>
          </div>
        </Link>
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
          <p className="text-2xl font-bold text-white"><CountUpNumber value={totalApps} /></p>
          <p className="text-xs text-zinc-500 mt-1">Total Applications</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Active</span>
          </div>
          <p className="text-2xl font-bold text-white"><CountUpNumber value={activePolicies} /></p>
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
          <p className="text-2xl font-bold text-white"><CountUpNumber value={totalClaims} /></p>
          <p className="text-xs text-zinc-500 mt-1">Total Claims Filed</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-teal-400" />
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
                          'bg-teal-500/10 text-teal-400 border-teal-500/20'
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
                              risk.riskLevel === 'HIGH' ? 'text-rose-400' : 'text-teal-400'
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


      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StatusPieChart data={policiesPieData} title="Policies by Status" />
        <StatusPieChart data={claimsPieData} title="Claims by Status" />
        <ActivityLineChart data={revenueData} title="Monthly Premium Revenue" color="emerald" />
      </div>

      {/* Business Intelligence Section */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight mb-1">Business Intelligence</h2>
        <p className="text-zinc-500 text-sm mb-6">
          ML-powered insights derived from your portfolio
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <StatusPieChart data={riskLevelPieData} title="Risk Level Distribution" />
          <div className="lg:col-span-2">
            <TopRiskDriversChart drivers={topRiskDrivers} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <TopFraudDriversChart drivers={topFraudDrivers} />
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-center">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-2">ML Explainability Coverage</p>
            <p className="text-3xl font-bold text-white">
              <CountUpNumber value={appsWithRisk.length} /> + <CountUpNumber value={claims.filter((c: any) => c.fraudAssessments?.[0]).length} />
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Predictions with SHAP feature contributions
              <span className="block text-[10px] text-zinc-600 mt-1">Risk model + Fraud model</span>
            </p>
          </div>
        </div>

        <ProductPerformanceTable rows={productPerformance} />
      </div>
    </div>
  );
}
