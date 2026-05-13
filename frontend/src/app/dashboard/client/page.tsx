import { Shield, FileCheck, Activity, AlertCircle, TrendingUp, AlertTriangle, ShieldCheck, Calculator, CreditCard, CheckCircle2, XCircle } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/formatDate';
import ClaimSubmissionForm from '@/components/ClaimSubmissionForm';
import QuoteCalculator from '@/components/QuoteCalculator';
import ClaimDocuments from '@/components/ClaimDocuments';
import PolicyPaymentButton from '@/components/PolicyPaymentButton';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getClientData() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value ?? '';
    const authHeader: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    const [appsRes, claimsRes, policiesRes, productsRes] = await Promise.all([
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
      fetch(`${API_URL}/products`, { cache: 'no-store' }).catch(() => null),
    ]);

    const appsJson = appsRes && appsRes.ok ? await appsRes.json() : { items: [] };
    const claimsJson = claimsRes && claimsRes.ok ? await claimsRes.json() : { items: [] };
    const policiesJson = policiesRes && policiesRes.ok ? await policiesRes.json() : { items: [] };
    const productsJson = productsRes && productsRes.ok ? await productsRes.json() : { items: [] };

    const applications = appsJson.items ?? [];
    const claims = claimsJson.items ?? [];
    const policies = policiesJson.items ?? [];
    const products = productsJson.items ?? [];

    return { applications, claims, policies, products };
  } catch (error) {
    return { applications: [], claims: [], policies: [], products: [] };
  }
}

export default async function ClientDashboard({ 
  searchParams 
}: { 
  searchParams: Promise<{ payment?: string; policy?: string }> 
}) {
  const { applications, claims, policies, products } = await getClientData();
  const { payment } = await searchParams;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Client Portal</h1>
          <p className="text-zinc-400 mt-1">Manage your active policies, applications, and claims.</p>
        </div>
      </div>

      {/* Payment Feedback Banners */}
      {payment === 'success' && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-emerald-400 font-bold uppercase text-xs tracking-wider">Payment Successful!</p>
            <p className="text-zinc-400 text-sm mt-0.5">Your policy will be activated shortly. Refresh in a few seconds if the status hasn't updated.</p>
          </div>
        </div>
      )}

      {payment === 'cancelled' && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <XCircle className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <p className="text-amber-400 font-bold uppercase text-xs tracking-wider">Payment Cancelled</p>
            <p className="text-zinc-400 text-sm mt-0.5">Your payment was not completed. You can try again whenever you're ready.</p>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <ShieldCheck className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Active Policies</p>
            <p className="text-xl font-bold text-white">{policies.filter((p: any) => p.status === 'ACTIVE').length}</p>
          </div>
        </div>
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

      <div className="space-y-12">
        {/* Claim Submission Form */}
        <ClaimSubmissionForm policies={policies} />

        {/* Personalized Quote Calculator */}
        <QuoteCalculator products={products} />

        {/* My Policies Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="h-5 w-5 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">My Policies</h2>
          </div>

          <div className="grid gap-4">
            {policies.length > 0 ? (
              policies.map((policy: any) => (
                <div key={policy.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
                  {policy.status === 'PENDING_PAYMENT' && (
                    <div className="bg-amber-500/5 border-b border-amber-500/10 px-5 py-2.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-amber-400" />
                        <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Action Required: Payment Pending</p>
                      </div>
                      <PolicyPaymentButton policyId={policy.id} amount={policy.premiumAmount} />
                    </div>
                  )}
                  
                  <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-zinc-800 flex items-center justify-center border border-zinc-700 flex-shrink-0">
                        <ShieldCheck className="h-6 w-6 text-blue-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-lg">{policy.product?.name || 'Unknown Product'}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-bold uppercase border border-zinc-700">
                            {policy.product?.type}
                          </span>
                        </div>
                        <p className="text-sm text-emerald-400 font-medium">{policy.product?.company?.name || 'Unknown Company'}</p>
                        <p className="text-xs text-zinc-500 mt-1 font-mono">Policy #: {policy.policyNumber}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-right mr-4 hidden md:block">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold">Coverage Period</p>
                        <p className="text-xs text-zinc-300">{formatDate(policy.startDate)} to {formatDate(policy.endDate)}</p>
                      </div>
                      <span className={`text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider border ${
                        policy.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        policy.status === 'PENDING_PAYMENT' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                      }`}>
                        {policy.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  
                  {/* Footer info */}
                  <div className="px-5 py-3 border-t border-zinc-800/50 bg-zinc-950/30 flex items-center justify-between">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight">
                      Linked Application: <span className="text-zinc-400 ml-1">{policy.applicationId.substring(0, 8)}...</span>
                    </p>
                    <button className="text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase tracking-tight transition-colors">
                      View Details →
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-xl p-12 text-center">
                <ShieldCheck className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500">No active policies yet. Approved applications will become policies.</p>
              </div>
            )}
          </div>
        </section>

        {/* My Applications Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <FileCheck className="h-5 w-5 text-indigo-400" />
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

                    {/* Documents Section */}
                    <div className="px-5 pb-4 border-t border-zinc-800/50">
                      <details className="group">
                        <summary className="list-none cursor-pointer py-2 flex items-center gap-2 text-[10px] text-zinc-500 hover:text-indigo-400 uppercase font-bold tracking-tight transition-colors">
                          <span className="group-open:rotate-90 transition-transform">▶</span>
                          Supporting Documents
                        </summary>
                        <div className="pt-1">
                          <ClaimDocuments claimId={claim.id} canUpload={true} />
                        </div>
                      </details>
                    </div>
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
