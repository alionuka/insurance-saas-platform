import { ShieldAlert, ArrowLeft, CreditCard, Activity, FileText, Calendar, Building2, Package, ShieldCheck, CheckCircle2, Clock, UserCircle } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/formatDate';
import { cookies } from 'next/headers';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getPolicy(id: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value ?? '';
    if (!token) return { status: 401 };

    const res = await fetch(`${API_URL}/policies/${id}`, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return { status: res.status };
    const data = await res.json();
    return { policy: data, status: 200 };
  } catch (error) {
    return { status: 500 };
  }
}

export default async function AgentPolicyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { policy, status } = await getPolicy(id);

  if (status === 401 || status === 403) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 border-2 border-dashed border-rose-900/30 rounded-3xl bg-rose-950/10 text-center">
        <ShieldAlert className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
        <p className="text-zinc-400 max-w-md">You do not have permission to view this policy.</p>
        <Link href="/dashboard/agent/applications" className="mt-6 text-sm font-bold text-teal-400 hover:text-teal-300 transition-colors uppercase tracking-widest">
          Back to Applications
        </Link>
      </div>
    );
  }

  if (status === 404) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <ShieldAlert className="h-12 w-12 text-zinc-700 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Policy Not Found</h2>
        <p className="text-zinc-400 max-w-md">The policy you are looking for does not exist or has been removed.</p>
        <Link href="/dashboard/agent/applications" className="mt-6 text-sm font-bold text-teal-400 hover:text-teal-300 transition-colors uppercase tracking-widest">
          Back to Applications
        </Link>
      </div>
    );
  }

  if (status !== 200 || !policy) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mb-4"></div>
        <p className="text-zinc-400">An error occurred while loading policy details.</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'PENDING_PAYMENT': return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      case 'EXPIRED': return 'bg-zinc-800 text-zinc-500 border-zinc-700';
      case 'CANCELLED': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-zinc-800 text-zinc-500 border-zinc-700';
    }
  };

  // Agent-specific: derive customer info via the linked application's user
  const customer = policy.application?.user ?? null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <Link
        href={policy.application ? `/dashboard/agent/applications/${policy.application.id}` : '/dashboard/agent/applications'}
        className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-widest group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Back to Application
      </Link>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 p-8 md:p-10">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4">
          <div className="h-64 w-64 rounded-full bg-teal-500/5 blur-3xl"></div>
        </div>

        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-bold text-white">{policy.product.name}</h1>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(policy.status)}`}>
                {policy.status.replace('_', ' ')}
              </span>
            </div>
            <div className="space-y-1">
              <p className="font-mono text-zinc-500 text-sm tracking-tight">Policy ID: {policy.policyNumber}</p>
              <div className="flex items-center gap-2 text-zinc-400">
                <Calendar className="h-4 w-4" />
                <p className="text-sm">Coverage: {formatDate(policy.startDate)} – {formatDate(policy.endDate)}</p>
              </div>
            </div>
          </div>

          <div className="text-left md:text-right">
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Annual Premium</p>
            <p className="text-3xl font-bold text-emerald-400">{formatCurrency(policy.premiumAmount)}</p>
            <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest mt-3">Read-only · Agent view</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Package className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Product Type</p>
            <p className="text-sm font-bold text-white">{policy.product.type}</p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Provider</p>
            <p className="text-sm font-bold text-white">{policy.product.company.name}</p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-teal-400" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Status</p>
            <p className="text-sm font-bold text-white">{policy.status.replace('_', ' ')}</p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <Clock className="h-5 w-5 text-zinc-400" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Effective Since</p>
            <p className="text-sm font-bold text-white">{formatDate(policy.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Customer card — distinguishes agent view from client view */}
      {customer && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserCircle className="h-5 w-5 text-teal-400" />
            <h2 className="text-lg font-bold text-white">Policy Holder</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Name</p>
              <p className="text-white font-medium mt-1">{customer.firstName} {customer.lastName}</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Email</p>
              <p className="text-zinc-300 mt-1 text-sm">{customer.email}</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Credit Score</p>
              <p className="text-zinc-300 mt-1 font-mono">{customer.creditScore ?? 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Claims */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-rose-500" />
            <h2 className="text-xl font-bold text-white">Claims History</h2>
          </div>

          <div className="space-y-4">
            {policy.claims && policy.claims.length > 0 ? (
              policy.claims.map((claim: any) => (
                <Link key={claim.id} href={`/dashboard/agent/claims/${claim.id}`} className="block bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors">
                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="font-mono text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Claim #{claim.id.substring(0, 8)}</p>
                        <p className="text-zinc-200 italic">"{claim.description}"</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                        claim.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        claim.status === 'DENIED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        'bg-zinc-800 text-zinc-500 border-zinc-700'
                      }`}>
                        {claim.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Amount</p>
                          <p className="text-sm font-bold text-white">{formatCurrency(claim.amount)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Filed On</p>
                          <p className="text-sm text-zinc-300 font-mono">{formatDate(claim.createdAt)}</p>
                        </div>
                      </div>

                      {claim.fraudAssessments?.[0] && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950/50 border border-zinc-800/50">
                          <ShieldCheck className={`h-3 w-3 ${claim.fraudAssessments[0].flag === 'SUSPICIOUS' ? 'text-rose-500' : 'text-emerald-500'}`} />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                            Fraud: <span className={claim.fraudAssessments[0].flag === 'SUSPICIOUS' ? 'text-rose-400' : 'text-emerald-400'}>{claim.fraudAssessments[0].flag}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-2xl p-12 text-center">
                <Activity className="h-10 w-10 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500">No claims filed against this policy yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Payments sidebar */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-teal-500" />
            <h2 className="text-xl font-bold text-white">Payment History</h2>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-950 text-zinc-500 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {policy.payments && policy.payments.length > 0 ? (
                    policy.payments.map((payment: any) => (
                      <tr key={payment.id} className="hover:bg-zinc-800/30 transition-colors group">
                        <td className="px-5 py-4">
                          <p className="text-xs text-zinc-300 font-mono">{formatDate(payment.createdAt)}</p>
                          <p className="text-[9px] text-zinc-600 font-mono mt-0.5 truncate max-w-[80px]">{payment.stripePaymentId}</p>
                        </td>
                        <td className="px-5 py-4 font-bold text-white">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${
                            payment.status === 'SUCCEEDED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            payment.status === 'FAILED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                            'bg-teal-500/10 text-teal-400 border-teal-500/20'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-5 py-10 text-center text-zinc-500 italic">No payment records yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
