import { Building2, Package, Briefcase, FileBarChart2 } from 'lucide-react';

async function getCompanyData() {
  try {
    const [productsRes, appsRes, claimsRes] = await Promise.all([
      fetch('http://localhost:3001/products', { cache: 'no-store' }).catch(() => null),
      fetch('http://localhost:3001/applications', { cache: 'no-store' }).catch(() => null),
      fetch('http://localhost:3001/claims', { cache: 'no-store' }).catch(() => null),
    ]);

    const products = productsRes && productsRes.ok ? await productsRes.json() : [];
    const applications = appsRes && appsRes.ok ? await appsRes.json() : [];
    const claims = claimsRes && claimsRes.ok ? await claimsRes.json() : [];

    // Aggregate by product to mock company view since we don't have company auth context
    return { products, applications, claims };
  } catch (error) {
    return { products: [], applications: [], claims: [] };
  }
}

export default async function CompanyDashboard() {
  const { products, applications, claims } = await getCompanyData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Company Dashboard</h1>
          <p className="text-zinc-400 mt-1">Manage your insurance products and analyze performance.</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-zinc-500">Demo Org: </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-zinc-800 text-white">
            <Building2 className="w-4 h-4 mr-2 text-indigo-400" />
            Acme Insurance Co.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex items-center">
          <div className="h-12 w-12 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Package className="h-6 w-6 text-indigo-500" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-zinc-400">Active Products</p>
            <p className="text-2xl font-bold text-white">{products.length}</p>
          </div>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex items-center">
          <div className="h-12 w-12 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Briefcase className="h-6 w-6 text-blue-500" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-zinc-400">Total Applications</p>
            <p className="text-2xl font-bold text-white">{applications.length}</p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex items-center">
          <div className="h-12 w-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <FileBarChart2 className="h-6 w-6 text-emerald-500" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-zinc-400">Claims Processed</p>
            <p className="text-2xl font-bold text-white">{claims.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
            <h2 className="text-lg font-medium text-white">Your Products</h2>
            <button className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">Add New</button>
          </div>
          <div className="divide-y divide-zinc-800">
            {products.map((product: any) => (
              <div key={product.id} className="p-6 hover:bg-zinc-800/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-md font-medium text-white">{product.name}</h3>
                    <p className="text-sm text-zinc-400 mt-1 line-clamp-1">{product.description}</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300">
                    ${product.basePrice}/mo
                  </span>
                </div>
                <div className="mt-4 flex items-center space-x-4 text-sm text-zinc-500">
                  <span>Applications: {applications.filter((a: any) => a.productId === product.id).length}</span>
                  <span>•</span>
                  <span>Active Policies: {Math.floor(applications.filter((a: any) => a.productId === product.id && a.status === 'APPROVED').length)}</span>
                </div>
              </div>
            ))}
            {products.length === 0 && (
              <div className="p-6 text-center text-zinc-500 text-sm">No products found.</div>
            )}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800">
             <h2 className="text-lg font-medium text-white">Performance Overview</h2>
          </div>
          <div className="p-6 space-y-6">
             <div>
               <div className="flex justify-between text-sm mb-2">
                 <span className="text-zinc-400">Application Approval Rate</span>
                 <span className="text-white font-medium">
                    {applications.length > 0 
                      ? Math.round((applications.filter((a: any) => a.status === 'APPROVED').length / applications.length) * 100) 
                      : 0}%
                 </span>
               </div>
               <div className="w-full bg-zinc-800 rounded-full h-2">
                 <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${applications.length > 0 ? (applications.filter((a: any) => a.status === 'APPROVED').length / applications.length) * 100 : 0}%` }}></div>
               </div>
             </div>

             <div>
               <div className="flex justify-between text-sm mb-2">
                 <span className="text-zinc-400">Claims Rejection Rate</span>
                 <span className="text-white font-medium">
                    {claims.length > 0 
                      ? Math.round((claims.filter((c: any) => c.status === 'REJECTED').length / claims.length) * 100) 
                      : 0}%
                 </span>
               </div>
               <div className="w-full bg-zinc-800 rounded-full h-2">
                 <div className="bg-red-500 h-2 rounded-full" style={{ width: `${claims.length > 0 ? (claims.filter((c: any) => c.status === 'REJECTED').length / claims.length) * 100 : 0}%` }}></div>
               </div>
             </div>

             <div className="pt-4 border-t border-zinc-800">
               <h3 className="text-sm font-medium text-white mb-4">Recent Feedback</h3>
               <div className="space-y-3">
                 <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                    <p className="text-xs text-zinc-400 italic">"The new auto policy is very competitive, seeing high uptake."</p>
                    <p className="text-[10px] text-zinc-500 mt-2">- Agent Smith</p>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
