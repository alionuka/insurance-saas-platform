import { Activity, Box, FileText, AlertTriangle, TrendingUp, ShieldAlert } from 'lucide-react';

async function getDashboardData() {
  try {
    const [productsRes, appsRes, claimsRes] = await Promise.all([
      fetch('http://localhost:3001/products', { cache: 'no-store' }).catch(() => null),
      fetch('http://localhost:3001/applications', { cache: 'no-store' }).catch(() => null),
      fetch('http://localhost:3001/claims', { cache: 'no-store' }).catch(() => null),
    ]);

    const products = productsRes && productsRes.ok ? await productsRes.json() : [];
    const applications = appsRes && appsRes.ok ? await appsRes.json() : [];
    const claims = claimsRes && claimsRes.ok ? await claimsRes.json() : [];

    return {
      totalProducts: products.length || 0,
      totalApplications: applications.length || 0,
      totalClaims: claims.length || 0,
      // Calculate mock/demo data based on real data
      suspiciousClaims: claims.filter((c: any) => c.status === 'UNDER_INVESTIGATION' || c.fraudScore > 75).length || Math.floor((claims.length || 0) * 0.1),
      averageRiskScore: applications.length ? Math.floor(applications.reduce((acc: number, app: any) => acc + (app.riskScore || 0), 0) / applications.length) : 34,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return {
      totalProducts: 0,
      totalApplications: 0,
      totalClaims: 0,
      suspiciousClaims: 0,
      averageRiskScore: 0,
    };
  }
}

export default async function DashboardOverview() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard Overview</h1>
        <p className="text-zinc-400 mt-1">Welcome to the InsurSaaS platform control center.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-400">Total Products</h3>
            <Box className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{data.totalProducts}</span>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-400">Applications</h3>
            <FileText className="h-5 w-5 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{data.totalApplications}</span>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-400">Claims</h3>
            <Activity className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{data.totalClaims}</span>
          </div>
        </div>

        <div className="bg-zinc-900 border border-red-900/50 rounded-xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-bl-full -mr-8 -mt-8"></div>
          <div className="flex items-center justify-between relative z-10">
            <h3 className="text-sm font-medium text-red-400">Suspicious Claims</h3>
            <ShieldAlert className="h-5 w-5 text-red-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2 relative z-10">
            <span className="text-3xl font-bold text-white">{data.suspiciousClaims}</span>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-400">Avg Risk Score</h3>
            <TrendingUp className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{data.averageRiskScore}</span>
            <span className="text-xs text-zinc-500">/ 100</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-4">Platform Activity</h3>
          <div className="h-64 flex items-center justify-center border border-dashed border-zinc-800 rounded-lg">
             <p className="text-zinc-500 text-sm">Chart visualization placeholder</p>
          </div>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-4">Recent Alerts</h3>
          <div className="space-y-4">
             {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-3 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">High risk policy detected</p>
                    <p className="text-xs text-zinc-400 mt-1">Application APP-{1000 + i} flagged for review.</p>
                  </div>
                </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}
