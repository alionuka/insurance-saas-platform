'use client';

import { useState } from 'react';
import { formatDate, formatCurrency } from '@/lib/formatDate';
import {
  ShieldAlert,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  User,
} from 'lucide-react';

/* ─── Constants ─────────────────────────────────────────────────────────────── */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const APPLICATION_STATUSES = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'] as const;
const CLAIM_STATUSES = ['FILED', 'IN_PROGRESS', 'APPROVED', 'DENIED'] as const;

type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
type ClaimStatus = (typeof CLAIM_STATUSES)[number];

/* ─── Colour maps ────────────────────────────────────────────────────────────── */

const appStatusColors: Record<ApplicationStatus, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  UNDER_REVIEW: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const claimStatusColors: Record<ClaimStatus, string> = {
  FILED: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  DENIED: 'bg-red-500/10 text-red-400 border-red-500/20',
};

/* ─── Sub-components ─────────────────────────────────────────────────────────── */

function StatusBadge({
  status,
  colorMap,
}: {
  status: string;
  colorMap: Record<string, string>;
}) {
  const color = colorMap[status] ?? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`}
    >
      {(status === 'PENDING' || status === 'FILED') && <Clock className="w-3 h-3" />}
      {status === 'APPROVED' && <CheckCircle className="w-3 h-3" />}
      {(status === 'REJECTED' || status === 'DENIED') && <XCircle className="w-3 h-3" />}
      {status === 'UNDER_REVIEW' && <TrendingUp className="w-3 h-3" />}
      {status === 'IN_PROGRESS' && <Loader2 className="w-3 h-3" />}
      {status.replace('_', ' ')}
    </span>
  );
}

function RiskBadge({ score, level }: { score: number | null; level: string | null }) {
  if (score === null) return <span className="text-xs text-zinc-500">N/A</span>;
  const high = score > 70;
  const med = score > 40;
  return (
    <div className="flex items-center gap-1.5">
      {high ? (
        <ShieldAlert className="h-4 w-4 text-red-500 shrink-0" />
      ) : med ? (
        <TrendingUp className="h-4 w-4 text-yellow-500 shrink-0" />
      ) : (
        <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
      )}
      <div>
        <span
          className={`text-sm font-medium ${high ? 'text-red-400' : med ? 'text-yellow-400' : 'text-emerald-400'}`}
        >
          {score.toFixed(0)}
        </span>
        {level && <span className="ml-1 text-[10px] text-zinc-500 uppercase">{level}</span>}
      </div>
    </div>
  );
}

function FraudBadge({ score, flag }: { score: number | null; flag: string | null }) {
  if (score === null) return <span className="text-xs text-zinc-500">N/A</span>;
  const high = score > 75;
  const med = score > 40;
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border w-fit
          ${high ? 'bg-red-500/10 text-red-400 border-red-500/20' :
            med ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}
      >
        {high && <ShieldAlert className="w-3 h-3" />}
        {high ? 'High' : med ? 'Med' : 'Low'} ({score.toFixed(0)})
      </span>
      {flag && (
        <span className="text-[10px] text-zinc-500 uppercase tracking-wide">{flag}</span>
      )}
    </div>
  );
}

function StatusSelect<T extends string>({
  currentStatus,
  options,
  isLoading,
  hasError,
  onChange,
}: {
  currentStatus: T;
  options: readonly T[];
  isLoading: boolean;
  hasError: boolean;
  onChange: (val: T) => void;
}) {
  if (isLoading) {
    return (
      <span className="flex items-center gap-1.5 text-zinc-400 text-xs">
        <Loader2 className="h-4 w-4 animate-spin" /> Saving…
      </span>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <select
        key={currentStatus} /* re-mount so defaultValue reflects server value */
        defaultValue={currentStatus}
        onChange={(e) => onChange(e.target.value as T)}
        className="text-xs bg-zinc-950 border border-zinc-700 text-white rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer hover:border-zinc-500 transition-colors"
      >
        {options.map((s) => (
          <option key={s} value={s}>
            {s.replace('_', ' ')}
          </option>
        ))}
      </select>
      {hasError && (
        <span className="text-[10px] text-red-400 flex items-center gap-0.5">
          <AlertCircle className="h-3 w-3" /> Update failed
        </span>
      )}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────────── */

export default function AgentWorkspace({
  initialApplications,
  initialClaims,
}: {
  initialApplications: any[];
  initialClaims: any[];
}) {
  const [applications, setApplications] = useState<any[]>(initialApplications);
  const [claims, setClaims] = useState<any[]>(initialClaims);

  // Per-row loading & error state
  const [loadingAppId, setLoadingAppId] = useState<string | null>(null);
  const [loadingClaimId, setLoadingClaimId] = useState<string | null>(null);
  const [errorAppIds, setErrorAppIds] = useState<Set<string>>(new Set());
  const [errorClaimIds, setErrorClaimIds] = useState<Set<string>>(new Set());
  const [successAppId, setSuccessAppId] = useState<string | null>(null);
  const [successClaimId, setSuccessClaimId] = useState<string | null>(null);

  async function updateApplicationStatus(id: string, status: ApplicationStatus) {
    setLoadingAppId(id);
    setErrorAppIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    setSuccessAppId(null);
    try {
      const res = await fetch(`${API_BASE}/applications/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      setApplications((prev) => prev.map((a) => (a.id === id ? updated : a)));
      setSuccessAppId(id);
      setTimeout(() => setSuccessAppId(null), 2500);
    } catch {
      setErrorAppIds((prev) => new Set(prev).add(id));
    } finally {
      setLoadingAppId(null);
    }
  }

  async function updateClaimStatus(id: string, status: ClaimStatus) {
    setLoadingClaimId(id);
    setErrorClaimIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    setSuccessClaimId(null);
    try {
      const res = await fetch(`${API_BASE}/claims/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      setClaims((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setSuccessClaimId(id);
      setTimeout(() => setSuccessClaimId(null), 2500);
    } catch {
      setErrorClaimIds((prev) => new Set(prev).add(id));
    } finally {
      setLoadingClaimId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Agent Workspace</h1>
        <p className="text-zinc-400 mt-1">Review applications and investigate claims.</p>
      </div>

      {/* Demo notice */}
      <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <span>
          <strong>Demo mode:</strong> Status actions are visible to all users until authentication is
          implemented. All changes are persisted to the database.
        </span>
      </div>

      {/* ── Applications Table ──────────────────────────────────────────────── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-lg font-medium text-white">Applications Queue</h2>
          <span className="bg-indigo-500/10 text-indigo-400 text-xs px-2.5 py-1 rounded-full font-medium">
            {applications.length} total
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-zinc-950/50 border-b border-zinc-800 text-xs uppercase text-zinc-500 tracking-wider">
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Product / Company</th>
                <th className="px-6 py-3 font-medium">Risk</th>
                <th className="px-6 py-3 font-medium">Current Status</th>
                <th className="px-6 py-3 font-medium">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {applications.map((app: any) => {
                const risk = app.riskAssessments?.[0] ?? null;
                return (
                  <tr
                    key={app.id}
                    className={`transition-colors ${
                      successAppId === app.id
                        ? 'bg-emerald-500/5'
                        : 'hover:bg-zinc-800/50'
                    }`}
                  >
                    {/* Customer */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-zinc-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">
                            {app.user
                              ? `${app.user.firstName} ${app.user.lastName}`
                              : `#${app.id.substring(0, 8)}`}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {formatDate(app.createdAt)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Product / Company */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {app.product?.name ?? '—'}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {app.product?.company?.name ?? '—'}
                      </div>
                    </td>

                    {/* Risk */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <RiskBadge
                        score={risk ? risk.riskScore : null}
                        level={risk ? risk.riskLevel : null}
                      />
                    </td>

                    {/* Current status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={app.status} colorMap={appStatusColors} />
                        {successAppId === app.id && (
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                        )}
                      </div>
                    </td>

                    {/* Update control */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusSelect
                        currentStatus={app.status as ApplicationStatus}
                        options={APPLICATION_STATUSES}
                        isLoading={loadingAppId === app.id}
                        hasError={errorAppIds.has(app.id)}
                        onChange={(val) => updateApplicationStatus(app.id, val)}
                      />
                    </td>
                  </tr>
                );
              })}
              {applications.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-zinc-500 text-sm">
                    No applications found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Claims Table ───────────────────────────────────────────────────── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-lg font-medium text-white">Claims Investigation Queue</h2>
          <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-medium">
            {claims.length} total
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-zinc-950/50 border-b border-zinc-800 text-xs uppercase text-zinc-500 tracking-wider">
                <th className="px-6 py-3 font-medium">Customer / Description</th>
                <th className="px-6 py-3 font-medium">Policy / Product</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Fraud Assessment</th>
                <th className="px-6 py-3 font-medium">Current Status</th>
                <th className="px-6 py-3 font-medium">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {claims.map((claim: any) => {
                const fraud = claim.fraudAssessments?.[0] ?? null;
                const policy = claim.policy ?? null;
                const product = claim.application?.product ?? null;
                const company = product?.company ?? null;

                return (
                  <tr
                    key={claim.id}
                    className={`transition-colors ${
                      successClaimId === claim.id
                        ? 'bg-emerald-500/5'
                        : 'hover:bg-zinc-800/50'
                    }`}
                  >
                    {/* Customer / Description */}
                    <td className="px-6 py-4 min-w-[250px]">
                      <div className="flex items-start gap-2">
                        <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
                          <User className="h-4 w-4 text-zinc-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">
                            {claim.user
                              ? `${claim.user.firstName} ${claim.user.lastName}`
                              : `#${claim.id.substring(0, 8)}`}
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-1 line-clamp-2 italic leading-relaxed">
                            "{claim.description}"
                          </div>
                          <div className="text-[10px] text-zinc-500 mt-1 uppercase tracking-tighter">
                            Filed: {formatDate(claim.createdAt)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Policy / Product */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {policy ? (
                          <>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-mono text-indigo-400 font-bold">{policy.policyNumber}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border uppercase ${
                                policy.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                              }`}>
                                {policy.status}
                              </span>
                            </div>
                            <div className="text-xs text-zinc-300 font-medium">{product?.name ?? '—'}</div>
                            <div className="text-[10px] text-zinc-500 uppercase">{company?.name ?? '—'}</div>
                          </>
                        ) : (
                          <span className="text-xs text-zinc-500 italic">No policy linked</span>
                        )}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-bold">
                        {formatCurrency(claim.amount)}
                      </div>
                    </td>

                    {/* Fraud */}
                    <td className="px-6 py-4 max-w-[300px]">
                      <div className="flex flex-col gap-1.5">
                        <FraudBadge
                          score={fraud ? fraud.fraudScore : null}
                          flag={fraud ? fraud.flag : null}
                        />
                        {fraud?.explanation && (
                          <div className="text-[10px] text-zinc-400 leading-tight border-l border-zinc-800 pl-2 italic">
                            {fraud.explanation}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Current status */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex flex-col items-center gap-2">
                        <StatusBadge status={claim.status} colorMap={claimStatusColors} />
                        {successClaimId === claim.id && (
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                        )}
                      </div>
                    </td>

                    {/* Update control */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusSelect
                        currentStatus={claim.status as ClaimStatus}
                        options={CLAIM_STATUSES}
                        isLoading={loadingClaimId === claim.id}
                        hasError={errorClaimIds.has(claim.id)}
                        onChange={(val) => updateClaimStatus(claim.id, val)}
                      />
                    </td>
                  </tr>
                );
              })}
              {claims.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-zinc-500 text-sm">
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
