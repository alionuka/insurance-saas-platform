import { Shield, FileCheck, Activity, AlertCircle, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/formatDate';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getClientData() {
  try {
    const [appsRes, claimsRes] = await Promise.all([
      fetch(`${API_URL}/applications`, { cache: 'no-store' }).catch(() => null),
      fetch(`${API_URL}/claims`, { cache: 'no-store' }).catch(() => null),
    ]);

    const applications = appsRes && appsRes.ok ? await appsRes.json() : [];
    const claims = claimsRes && claimsRes.ok ? await claimsRes.json() : [];

    return { applications, claims };
  } catch (error) {
    return { applications: [], claims: [] };
  }
}

export default async function ClientDashboard() {
  const { applications, claims } = await getClientData();

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Client Portal</h1>
          <p className="text-zinc-400 mt-1">Monitor your insurance applications and claims status.</p>
        </div>
      </div>

      {/* Stats Overview (Optional but fits the style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <FileCheck className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Applications</p>
            <p className="text-xl font-bold text-white">{applications.length}</p>
          </div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <Activity className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Active Claims</p>
            <p className="text-xl font-bold text-white">{claims.length}</p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* My Applications Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-indigo-400" />
            <h2 className="text-xl font-semibold text-white">My Applications</h2>
          </div>
          
          <div className="grid gap-4">
            {applications.length > 0 ? (
              applications.map((app: any) => {
                const risk = app.riskAssessments?.[0];
                return (
                  <div key={app.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
                    <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-zinc-800 flex items-center justify-center border border-zinc-700 flex-shrink-0">
                          <FileCheck className="h-6 w-6 text-indigo-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg">{app.product?.name || 'Unknown Product'}</h3>
                          <p className="text-sm text-emerald-400 font-medium">{app.product?.company?.name || 'Unknown Company'}</p>
                          <p className="text-xs text-zinc-500 mt-1 italic">Application ID: {app.id.substring(0, 8)} • Submitted: {formatDate(app.createdAt)}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider border ${
                          app.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                          app.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                    </div>

                    {/* Risk Assessment Info */}
                    {risk && (
                      <div className="px-5 pb-5 pt-0 border-t border-zinc-800/50 bg-zinc-950/30">
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="md:col-span-1 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingUp className="h-3 w-3 text-zinc-500" />
                              <span className="text-[10px] text-zinc-500 uppercase font-bold">Risk Score</span>
                            </div>
                            <p className="text-lg font-mono font-bold text-white">{risk.riskScore.toFixed(1)}<span className="text-xs text-zinc-500 ml-1">/ 100</span></p>
                          </div>
                          <div className="md:col-span-1 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                            <div className="flex items-center gap-2 mb-1">
                              <AlertCircle className="h-3 w-3 text-zinc-500" />
                              <span className="text-[10px] text-zinc-500 uppercase font-bold">Risk Level</span>
                            </div>
                            <p className={`text-lg font-bold ${
                              risk.riskLevel === 'LOW' ? 'text-emerald-400' : 
                              risk.riskLevel === 'HIGH' ? 'text-rose-400' : 'text-amber-400'
                            }`}>{risk.riskLevel}</p>
                          </div>
                          <div className="md:col-span-2 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                            <div className="flex items-center gap-2 mb-1">
                              <AlertTriangle className="h-3 w-3 text-zinc-500" />
                              <span className="text-[10px] text-zinc-500 uppercase font-bold">ML Explanation</span>
                            </div>
                            <p className="text-xs text-zinc-400 italic leading-relaxed">"{risk.explanation}"</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-xl p-12 text-center">
                <FileCheck className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500">No applications found in your history.</p>
              </div>
            )}
          </div>
        </section>

        {/* My Claims Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-emerald-400" />
            <h2 className="text-xl font-semibold text-white">My Claims</h2>
          </div>

          <div className="grid gap-4">
            {claims.length > 0 ? (
              claims.map((claim: any) => {
                const fraud = claim.fraudAssessments?.[0];
                return (
                  <div key={claim.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
                    <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-zinc-800 flex items-center justify-center border border-zinc-700 flex-shrink-0">
                          <Activity className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div className="flex-grow">
                          <h3 className="font-bold text-white text-lg">{claim.application?.product?.name || 'Claim'}</h3>
                          <p className="text-sm text-zinc-300 mt-1 font-medium">{claim.description}</p>
                          <p className="text-xs text-zinc-500 mt-1 italic">Claim ID: {claim.id.substring(0, 8)} • Amount: {formatCurrency(claim.amount)} • Filed: {formatDate(claim.createdAt)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                         <span className={`text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider border ${
                          claim.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                          claim.status === 'DENIED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                          'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                        }`}>
                          {claim.status}
                        </span>
                      </div>
                    </div>

                    {/* Fraud Assessment Info */}
                    {fraud && (
                      <div className="px-5 pb-5 pt-0 border-t border-zinc-800/50 bg-zinc-950/30">
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="md:col-span-1 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingUp className="h-3 w-3 text-zinc-500" />
                              <span className="text-[10px] text-zinc-500 uppercase font-bold">Fraud Score</span>
                            </div>
                            <p className="text-lg font-mono font-bold text-white">{fraud.fraudScore.toFixed(1)}<span className="text-xs text-zinc-500 ml-1">/ 100</span></p>
                          </div>
                          <div className="md:col-span-1 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                            <div className="flex items-center gap-2 mb-1">
                              <AlertCircle className="h-3 w-3 text-zinc-500" />
                              <span className="text-[10px] text-zinc-500 uppercase font-bold">Fraud Flag</span>
                            </div>
                            <p className={`text-lg font-bold ${
                              fraud.flag === 'NORMAL' ? 'text-emerald-400' : 'text-rose-400 animate-pulse'
                            }`}>{fraud.flag}</p>
                          </div>
                          <div className="md:col-span-2 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                            <div className="flex items-center gap-2 mb-1">
                              <AlertTriangle className="h-3 w-3 text-zinc-500" />
                              <span className="text-[10px] text-zinc-500 uppercase font-bold">ML Assessment</span>
                            </div>
                            <p className="text-xs text-zinc-400 italic leading-relaxed">"{fraud.explanation}"</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-xl p-12 text-center">
                <Activity className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500">No claims found in your history.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
