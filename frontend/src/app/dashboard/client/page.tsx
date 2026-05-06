import { Shield, FileCheck, ArrowRight, Activity } from 'lucide-react';
import { formatDate } from '@/lib/formatDate';

async function getClientData() {
  try {
    const [productsRes, appsRes, claimsRes] = await Promise.all([
      fetch('http://localhost:3001/products', { cache: 'no-store' }).catch(() => null),
      fetch('http://localhost:3001/applications', { cache: 'no-store' }).catch(() => null),
      fetch('http://localhost:3001/claims', { cache: 'no-store' }).catch(() => null),
    ]);

    const products = productsRes && productsRes.ok ? await productsRes.json() : [];
    const applications = appsRes && appsRes.ok ? await appsRes.json() : [];
    const claims = claimsRes && claimsRes.ok ? await claimsRes.json() : [];

    return { products, applications, claims };
  } catch (error) {
    return { products: [], applications: [], claims: [] };
  }
}

export default async function ClientDashboard() {
  const { products, applications, claims } = await getClientData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Client Portal</h1>
        <p className="text-zinc-400 mt-1">Manage your policies and file claims.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-medium text-white mb-4">Available Products</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {products.slice(0, 4).map((product: any) => (
                <div key={product.id} className="p-4 rounded-lg border border-zinc-800 bg-zinc-950 hover:border-indigo-500/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-white">{product.name}</h3>
                      <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{product.description}</p>
                    </div>
                    <Shield className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-lg font-semibold text-white">${product.basePrice}<span className="text-xs text-zinc-500 font-normal">/mo</span></span>
                    <button className="text-xs font-medium bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-full hover:bg-indigo-500/20 transition-colors flex items-center">
                      Apply <ArrowRight className="ml-1 h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <p className="text-zinc-500 text-sm">No products available.</p>
              )}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-medium text-white mb-4">Your Applications</h2>
            <div className="space-y-3">
              {applications.slice(0, 3).map((app: any) => (
                <div key={app.id} className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-950">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
                      <FileCheck className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-white">Application #{app.id.substring(0, 8)}</p>
                      <p className="text-xs text-zinc-400">Submitted on {formatDate(app.createdAt)}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${app.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' : app.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                    {app.status}
                  </span>
                </div>
              ))}
              {applications.length === 0 && (
                <p className="text-zinc-500 text-sm">No applications found.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-medium text-white mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 transition-colors group">
                <p className="text-sm font-medium text-white group-hover:text-indigo-400">File a Claim</p>
                <p className="text-xs text-zinc-500 mt-0.5">Start a new claim process</p>
              </button>
              <button className="w-full text-left px-4 py-3 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 transition-colors group">
                <p className="text-sm font-medium text-white group-hover:text-indigo-400">View Policies</p>
                <p className="text-xs text-zinc-500 mt-0.5">Access your policy documents</p>
              </button>
              <button className="w-full text-left px-4 py-3 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 transition-colors group">
                <p className="text-sm font-medium text-white group-hover:text-indigo-400">Update Profile</p>
                <p className="text-xs text-zinc-500 mt-0.5">Manage your personal info</p>
              </button>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-medium text-white mb-4">Recent Claims</h2>
            <div className="space-y-3">
              {claims.slice(0, 3).map((claim: any) => (
                <div key={claim.id} className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-950">
                   <div className="flex items-center">
                    <Activity className="h-4 w-4 text-emerald-500 mr-2" />
                    <div>
                      <p className="text-xs font-medium text-white">Claim {claim.id.substring(0, 6)}</p>
                      <p className="text-[10px] text-zinc-500">{claim.type || 'General'}</p>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400">${claim.amount}</p>
                </div>
              ))}
              {claims.length === 0 && (
                <p className="text-zinc-500 text-sm">No claims found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
