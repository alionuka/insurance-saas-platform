import { ShieldAlert, TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react';

async function getAgentData() {
  try {
    const [appsRes, claimsRes] = await Promise.all([
      fetch('http://localhost:3001/applications', { cache: 'no-store' }).catch(() => null),
      fetch('http://localhost:3001/claims', { cache: 'no-store' }).catch(() => null),
    ]);

    const applications = appsRes && appsRes.ok ? await appsRes.json() : [];
    const claims = claimsRes && claimsRes.ok ? await claimsRes.json() : [];

    return { applications, claims };
  } catch (error) {
    return { applications: [], claims: [] };
  }
}

export default async function AgentDashboard() {
  const { applications, claims } = await getAgentData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Agent Workspace</h1>
        <p className="text-zinc-400 mt-1">Review applications and investigate claims.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-lg font-medium text-white">Applications Queue</h2>
          <span className="bg-indigo-500/10 text-indigo-400 text-xs px-2.5 py-1 rounded-full font-medium">
            {applications.length} Total
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/50 border-b border-zinc-800 text-xs uppercase text-zinc-500 tracking-wider">
                <th className="px-6 py-3 font-medium">ID / Date</th>
                <th className="px-6 py-3 font-medium">Product</th>
                <th className="px-6 py-3 font-medium">Risk Score</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {applications.map((app: any) => (
                <tr key={app.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">#{app.id.substring(0, 8)}</div>
                    <div className="text-xs text-zinc-500">{new Date(app.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-zinc-300">{app.productId.substring(0, 8)}...</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {app.riskScore > 70 ? (
                        <ShieldAlert className="h-4 w-4 text-red-500 mr-2" />
                      ) : app.riskScore > 40 ? (
                        <TrendingUp className="h-4 w-4 text-yellow-500 mr-2" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-emerald-500 mr-2" />
                      )}
                      <span className={`text-sm font-medium ${app.riskScore > 70 ? 'text-red-400' : app.riskScore > 40 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                        {app.riskScore || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${app.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' : 
                        app.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' : 
                        'bg-yellow-500/10 text-yellow-400'}`}>
                      {app.status === 'PENDING' && <Clock className="w-3 h-3 mr-1" />}
                      {app.status === 'APPROVED' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {app.status === 'REJECTED' && <XCircle className="w-3 h-3 mr-1" />}
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                    <button className="text-indigo-400 hover:text-indigo-300 font-medium">Review</button>
                  </td>
                </tr>
              ))}
              {applications.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500 text-sm">
                    No applications found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-lg font-medium text-white">Claims Investigation Queue</h2>
          <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-medium">
            {claims.length} Total
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/50 border-b border-zinc-800 text-xs uppercase text-zinc-500 tracking-wider">
                <th className="px-6 py-3 font-medium">ID / Date</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Fraud Score</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {claims.map((claim: any) => (
                <tr key={claim.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">#{claim.id.substring(0, 8)}</div>
                    <div className="text-xs text-zinc-500">{new Date(claim.createdAt || Date.now()).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">${claim.amount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {claim.fraudScore > 75 ? (
                        <span className="bg-red-500/10 text-red-400 px-2 py-1 rounded text-xs font-bold border border-red-500/20 flex items-center">
                          <ShieldAlert className="w-3 h-3 mr-1" /> High Risk ({claim.fraudScore})
                        </span>
                      ) : claim.fraudScore > 40 ? (
                        <span className="bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded text-xs font-bold border border-yellow-500/20">
                          Med Risk ({claim.fraudScore})
                        </span>
                      ) : (
                        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-xs font-bold border border-emerald-500/20">
                          Low Risk ({claim.fraudScore || 0})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${claim.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' : 
                        claim.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' : 
                        claim.status === 'UNDER_INVESTIGATION' ? 'bg-red-900/50 text-red-400 border border-red-500/50' :
                        'bg-yellow-500/10 text-yellow-400'}`}>
                      {claim.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                    <button className="text-indigo-400 hover:text-indigo-300 font-medium">Investigate</button>
                  </td>
                </tr>
              ))}
              {claims.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500 text-sm">
                    No claims found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
