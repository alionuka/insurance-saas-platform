import { Users, Server, Activity, Database, Zap, Shield, Key, TrendingUp } from 'lucide-react';

async function getAdminData() {
  try {
    const [companiesRes, appsRes] = await Promise.all([
      fetch('http://localhost:3001/companies', { cache: 'no-store' }).catch(() => null),
      fetch('http://localhost:3001/applications', { cache: 'no-store' }).catch(() => null),
    ]);

    const companies = companiesRes && companiesRes.ok ? await companiesRes.json() : [];
    const applications = appsRes && appsRes.ok ? await appsRes.json() : [];

    return { companies, applications };
  } catch (error) {
    return { companies: [], applications: [] };
  }
}

export default async function AdminDashboard() {
  const { companies, applications } = await getAdminData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Platform Administration</h1>
        <p className="text-zinc-400 mt-1">Global system metrics and platform configuration.</p>
      </div>

      {/* Platform Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-400">Total Companies</span>
            <Database className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-white">{companies.length}</p>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-400">API Requests/min</span>
            <Activity className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-white">1,204</p>
          <p className="text-xs text-emerald-400 mt-1 flex items-center">
            <TrendingUp className="h-3 w-3 mr-1" /> +14% today
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-400">System Load</span>
            <Server className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-white">34%</p>
          <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '34%' }}></div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-400">ML Engine Latency</span>
            <Zap className="h-4 w-4 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-white">42ms</p>
          <p className="text-xs text-zinc-500 mt-1">p95 response time</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Companies Overview */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
            <h2 className="text-lg font-medium text-white">Registered Companies</h2>
            <button className="text-xs bg-white text-black px-3 py-1.5 rounded font-medium hover:bg-zinc-200 transition-colors">
              Add Company
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950/50 border-b border-zinc-800 text-xs uppercase text-zinc-500 tracking-wider">
                  <th className="px-6 py-3 font-medium">Company Name</th>
                  <th className="px-6 py-3 font-medium">Industry</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {companies.map((company: any) => (
                  <tr key={company.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-white">
                          {company.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-white">{company.name}</p>
                          <p className="text-xs text-zinc-500">{company.contactEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-zinc-300">{company.industry}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
                {companies.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-zinc-500 text-sm">
                      No companies registered.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Users / Roles (Placeholder) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800">
            <h2 className="text-lg font-medium text-white flex items-center">
              <Users className="w-5 h-5 mr-2 text-zinc-400" />
              User & Role Management
            </h2>
          </div>
          <div className="p-6">
            <div className="flex flex-col items-center justify-center py-8 px-4 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-950/50 text-center">
              <Key className="w-10 h-10 text-zinc-600 mb-3" />
              <h3 className="text-sm font-medium text-zinc-300">Authentication System Pending</h3>
              <p className="text-xs text-zinc-500 mt-2 max-w-sm">
                User management will be available once the central authentication service (OAuth/OIDC) is integrated. 
                Role-based access control (RBAC) maps are currently defined in code.
              </p>
              <button className="mt-4 text-xs font-medium bg-zinc-800 text-white px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors">
                Configure Identity Provider
              </button>
            </div>

            <div className="mt-6 space-y-3">
              <h4 className="text-sm font-medium text-white">Configured Roles</h4>
              {[
                { name: 'Platform Admin', count: 3, color: 'indigo' },
                { name: 'Company Admin', count: 12, color: 'blue' },
                { name: 'Underwriting Agent', count: 48, color: 'emerald' },
                { name: 'End Client', count: '1,204', color: 'zinc' },
              ].map((role) => (
                <div key={role.name} className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                  <div className="flex items-center">
                    <Shield className={`w-4 h-4 text-${role.color}-400 mr-3`} />
                    <span className="text-sm font-medium text-white">{role.name}</span>
                  </div>
                  <span className="text-xs text-zinc-500">{role.count} provisioned</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
