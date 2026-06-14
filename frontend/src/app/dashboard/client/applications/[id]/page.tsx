import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, ShieldAlert, TrendingUp, CheckCircle, ShieldCheck, Box, Calendar } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/formatDate';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getApplication(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value ?? '';
  if (!token) return { status: 401 };

  try {
    const res = await fetch(`${API_URL}/applications/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });

    if (res.status === 401) return { status: 401 };
    if (res.status === 403) return { status: 403 };
    if (res.status === 404) return { status: 404 };
    if (!res.ok) return { status: 500 };

    const data = await res.json();
    return { status: 200, data };
  } catch (error) {
    return { status: 500 };
  }
}

export default async function ClientApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getApplication(id);

  if (result.status === 401) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-zinc-400">Session expired. Redirecting...</p>
      </div>
    );
  }

  if (result.status === 403 || result.status === 404) {
    notFound();
  }

  if (result.status !== 200 || !result.data) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
        <h2 className="text-lg font-semibold">Error Loading Application</h2>
        <p className="text-sm mt-1">We couldn't fetch the application details. Please try again later.</p>
      </div>
    );
  }

  const app = result.data;
  const product = app.product;
  const risk = app.riskAssessments?.[0];
  const policy = app.policy;

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'REJECTED': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'PENDING': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'UNDER_REVIEW': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'text-emerald-400';
      case 'MEDIUM': return 'text-blue-400';
      case 'HIGH': return 'text-rose-400';
      default: return 'text-zinc-400';
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <Link 
        href="/dashboard/client/applications"
        className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-blue-400 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Applications
      </Link>

      {/* Hero */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 flex items-start gap-4 shadow-xl">
        <div className="h-16 w-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
          <FileText className="h-8 w-8 text-blue-400" />
        </div>
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                Application <span className="font-mono text-zinc-500 text-lg">#{app.id.slice(0, 8)}</span>
              </h1>
              <p className="text-zinc-400 mt-1">Review your application details and status.</p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusPill(app.status)}`}>
              {app.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Product Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <Box className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Product Overview</h2>
          </div>
          {product ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Insurance Plan</p>
                <p className="text-white font-medium text-lg mt-1">{product.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Type</p>
                  <p className="text-zinc-300 mt-1 uppercase font-bold text-sm bg-zinc-800 inline-block px-2 py-0.5 rounded">{product.type}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Base Premium</p>
                  <p className="text-blue-400 mt-1 font-bold">{formatCurrency(product.basePremium)}</p>
                </div>
              </div>
              {product.company && (
                <div className="pt-4 border-t border-zinc-800/50">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Underwriter</p>
                  <p className="text-zinc-300 mt-1 font-medium">{product.company.name}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 italic">No product details available.</p>
          )}
        </div>

        {/* Risk Assessment Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-md flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Risk Assessment</h2>
          </div>
          {risk ? (
            <div className="flex-1 flex flex-col">
              <div className="flex items-end gap-3 mb-4">
                <span className="text-4xl font-bold font-mono text-white leading-none">
                  {risk.riskScore.toFixed(0)}
                </span>
                <span className="text-sm text-zinc-500 mb-1">/ 100 score</span>
              </div>
              <div className="mb-4">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-zinc-950 ${getRiskLevelColor(risk.riskLevel)} border-current/20`}>
                  {risk.riskLevel} Risk
                </span>
              </div>
              <div className="mt-auto p-4 bg-zinc-950/50 rounded-lg border border-zinc-800">
                <p className="text-xs text-zinc-400 italic leading-relaxed">
                  "{risk.explanation}"
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-6 border border-dashed border-zinc-800 rounded-lg">
              <p className="text-sm text-zinc-500">Risk assessment has not been completed yet.</p>
            </div>
          )}
        </div>

        {/* Linked Policy Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-md md:col-span-2 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="mt-1 h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Linked Policy</h2>
              {policy ? (
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-zinc-300">
                    Policy Number: <span className="font-mono font-bold text-white uppercase">{policy.policyNumber}</span>
                  </p>
                  <p className="text-sm text-zinc-300">
                    Status: <span className="text-emerald-400 font-medium">{policy.status.replace('_', ' ')}</span>
                  </p>
                  <p className="text-sm text-zinc-300">
                    Premium: <span className="text-blue-400 font-bold">{formatCurrency(policy.premiumAmount)}</span>
                  </p>
                </div>
              ) : (
                <p className="text-sm text-zinc-500 mt-1">
                  {app.status === 'APPROVED' 
                    ? 'Policy is being generated.' 
                    : app.status === 'REJECTED'
                    ? 'Application was rejected. No policy will be issued.'
                    : 'Policy will be created once approved.'}
                </p>
              )}
            </div>
          </div>
          {policy && (
            <Link
              href={`/dashboard/client/policies/${policy.id}`}
              className="inline-flex justify-center items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20 shrink-0"
            >
              View Policy
            </Link>
          )}
        </div>

        {/* Timeline Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-md md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-zinc-400" />
            <h2 className="text-lg font-bold text-white">Timeline</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-950/50 rounded-lg border border-zinc-800">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Submitted On</p>
              <p className="text-zinc-300 mt-1 font-medium">{formatDate(app.createdAt)}</p>
            </div>
            <div className="p-4 bg-zinc-950/50 rounded-lg border border-zinc-800">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Last Updated</p>
              <p className="text-zinc-300 mt-1 font-medium">{formatDate(app.updatedAt)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
