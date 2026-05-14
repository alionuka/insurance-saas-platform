import { cookies } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft, Activity, ShieldCheck, ShieldAlert, AlertTriangle, TrendingUp, AlertCircle, User } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/formatDate';
import ClaimDocuments from '@/components/ClaimDocuments';
import StatusUpdateForm from './StatusUpdateForm';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getClaimDetails(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) {
    return { status: 401, data: null };
  }

  try {
    const res = await fetch(`${API_URL}/claims/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (res.status === 401 || res.status === 403) {
      return { status: 403, data: null };
    }
    if (res.status === 404) {
      return { status: 404, data: null };
    }
    if (!res.ok) {
      return { status: res.status, data: null };
    }

    const data = await res.json();
    return { status: 200, data };
  } catch (error) {
    return { status: 500, data: null };
  }
}

export default async function AgentClaimDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status, data: claim } = await getClaimDetails(id);

  if (status === 401 || status === 403) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <ShieldAlert className="h-16 w-16 text-rose-500" />
        <h1 className="text-2xl font-bold text-white">Access Denied</h1>
        <p className="text-zinc-400">You do not have permission to view this claim.</p>
        <Link href="/dashboard/agent" className="text-indigo-400 hover:text-indigo-300 font-medium">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  if (status === 404 || !claim) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <AlertTriangle className="h-16 w-16 text-amber-500" />
        <h1 className="text-2xl font-bold text-white">Claim Not Found</h1>
        <p className="text-zinc-400">The claim you are looking for does not exist.</p>
        <Link href="/dashboard/agent" className="text-indigo-400 hover:text-indigo-300 font-medium">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const fraud = claim.fraudAssessments?.[0];
  const policy = claim.policy;
  const product = claim.application?.product;
  const company = product?.company;

  const statusColors: Record<string, string> = {
    FILED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    IN_PROGRESS: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    DENIED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  const fraudFlagColors: Record<string, string> = {
    NORMAL: 'text-emerald-400',
    SUSPICIOUS: 'text-amber-400',
    FRAUDULENT: 'text-rose-400',
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <Link href="/dashboard/agent" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium">
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Hero Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-2xl bg-zinc-800 flex items-center justify-center border border-zinc-700 flex-shrink-0">
              <Activity className="h-8 w-8 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  Claim #{claim.id.substring(0, 8)}
                </h1>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${statusColors[claim.status] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                  {claim.status}
                </span>
              </div>
              <p className="text-xl text-zinc-300 font-medium mb-1">
                {formatCurrency(claim.amount)}
              </p>
              <p className="text-sm text-zinc-500">
                Filed: {formatDate(claim.createdAt)}
              </p>
            </div>
          </div>
          <div className="bg-zinc-950/50 rounded-lg p-4 border border-zinc-800/50 min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-zinc-500" />
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Customer</span>
            </div>
            <p className="text-sm font-medium text-white">
              {claim.user ? `${claim.user.firstName} ${claim.user.lastName}` : 'Unknown Customer'}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {claim.user?.email || 'No email provided'}
            </p>
          </div>
        </div>
      </div>

      {/* Linked Policy Section */}
      <div>
        {policy ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 flex-shrink-0">
              <ShieldCheck className="h-6 w-6 text-blue-400" />
            </div>
            <div className="flex-grow">
              <p className="text-sm font-bold text-white mb-0.5">Policy #{policy.policyNumber}</p>
              <p className="text-xs text-zinc-400">{product?.name || 'Unknown Product'} • {company?.name || 'Unknown Company'}</p>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-xl p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-zinc-800 flex items-center justify-center border border-zinc-700 flex-shrink-0">
              <ShieldCheck className="h-6 w-6 text-zinc-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-400 mb-0.5">No active policy linked</p>
              <p className="text-xs text-zinc-500">Application: {claim.applicationId}</p>
            </div>
          </div>
        )}
      </div>

      {/* Description Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 md:p-8">
        <h2 className="text-lg font-semibold text-white mb-4">Incident Description</h2>
        <div className="bg-zinc-950/50 rounded-lg p-5 border border-zinc-800/50">
          <p className="text-zinc-300 italic leading-relaxed whitespace-pre-wrap">
            "{claim.description}"
          </p>
        </div>
      </div>

      {/* Fraud Assessment Section */}
      {fraud && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6">
            <ShieldAlert className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Fraud Assessment</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1 p-4 rounded-lg bg-zinc-950/50 border border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-zinc-500" />
                <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Score</span>
              </div>
              <p className="text-2xl font-mono font-bold text-white">
                {fraud.fraudScore.toFixed(1)}<span className="text-sm text-zinc-500 ml-1">/ 100</span>
              </p>
            </div>
            <div className="md:col-span-1 p-4 rounded-lg bg-zinc-950/50 border border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-zinc-500" />
                <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Flag</span>
              </div>
              <p className={`text-xl font-bold ${fraudFlagColors[fraud.flag] || 'text-zinc-400'}`}>
                {fraud.flag}
              </p>
            </div>
            <div className="md:col-span-2 p-4 rounded-lg bg-zinc-950/50 border border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-zinc-500" />
                <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">ML Assessment</span>
              </div>
              <p className="text-sm text-zinc-400 italic leading-relaxed">
                "{fraud.explanation}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Widget */}
      <StatusUpdateForm claimId={claim.id} currentStatus={claim.status} />

      {/* Documents Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 md:p-8">
        <h2 className="text-lg font-semibold text-white mb-6">Supporting Documents</h2>
        <ClaimDocuments claimId={claim.id} canUpload={false} />
      </div>

    </div>
  );
}
