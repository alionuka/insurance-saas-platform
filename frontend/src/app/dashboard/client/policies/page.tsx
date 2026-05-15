import { cookies } from 'next/headers';
import Link from 'next/link';
import { ShieldCheck, CreditCard } from 'lucide-react';
import { formatDate } from '@/lib/formatDate';
import PolicyPaymentButton from '@/components/PolicyPaymentButton';
import StopClickPropagation from '@/components/StopClickPropagation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getPolicies() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value ?? '';
    const authHeader: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    const res = await fetch(`${API_URL}/policies`, { 
      cache: 'no-store',
      headers: authHeader,
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items ?? [];
  } catch (error) {
    return [];
  }
}

export default async function ClientPoliciesPage() {
  const policies = await getPolicies();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Your Policies</h1>
        <p className="text-zinc-400 mt-1 text-sm">Manage your active policies and pending payments.</p>
      </div>

      <div className="grid gap-4">
        {policies.length > 0 ? (
          policies.map((policy: any) => (
            <Link key={policy.id} href={`/dashboard/client/policies/${policy.id}`} className="block group">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden group-hover:border-zinc-700 transition-colors">
                {policy.status === 'PENDING_PAYMENT' && (
                  <div className="bg-amber-500/5 border-b border-amber-500/10 px-5 py-2.5 flex items-center justify-between gap-4 relative z-10">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-amber-400" />
                      <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Action Required: Payment Pending</p>
                    </div>
                    <StopClickPropagation>
                      <PolicyPaymentButton policyId={policy.id} amount={policy.premiumAmount} />
                    </StopClickPropagation>
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
                  <div className="text-[10px] text-blue-400 group-hover:text-blue-300 font-bold uppercase tracking-tight transition-colors">
                    View Details →
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-xl p-12 text-center">
            <ShieldCheck className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">No policies yet. Approved applications become policies.</p>
          </div>
        )}
      </div>
    </div>
  );
}
