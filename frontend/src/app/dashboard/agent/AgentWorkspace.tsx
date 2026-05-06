'use client';

import { useState } from 'react';
import { ShieldAlert, TrendingUp, CheckCircle, XCircle, Clock, Loader2, AlertCircle } from 'lucide-react';

const APPLICATION_STATUSES = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'] as const;
const CLAIM_STATUSES = ['FILED', 'IN_PROGRESS', 'APPROVED', 'DENIED'] as const;

type ApplicationStatus = typeof APPLICATION_STATUSES[number];
type ClaimStatus = typeof CLAIM_STATUSES[number];

const appStatusColors: Record<ApplicationStatus, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-400',
  UNDER_REVIEW: 'bg-blue-500/10 text-blue-400',
  APPROVED: 'bg-emerald-500/10 text-emerald-400',
  REJECTED: 'bg-red-500/10 text-red-400',
};

const claimStatusColors: Record<ClaimStatus, string> = {
  FILED: 'bg-yellow-500/10 text-yellow-400',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-400',
  APPROVED: 'bg-emerald-500/10 text-emerald-400',
  DENIED: 'bg-red-500/10 text-red-400',
};

const API_BASE = 'http://localhost:3001';

function StatusBadge({ status, colorMap }: { status: string; colorMap: Record<string, string> }) {
  const color = colorMap[status] ?? 'bg-zinc-500/10 text-zinc-400';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {status === 'PENDING' || status === 'FILED' ? <Clock className="w-3 h-3 mr-1" /> : null}
      {status === 'APPROVED' ? <CheckCircle className="w-3 h-3 mr-1" /> : null}
      {status === 'REJECTED' || status === 'DENIED' ? <XCircle className="w-3 h-3 mr-1" /> : null}
      {status}
    </span>
  );
}

export default function AgentWorkspace({
  initialApplications,
  initialClaims,
}: {
  initialApplications: any[];
  initialClaims: any[];
}) {
  const [applications, setApplications] = useState(initialApplications);
  const [claims, setClaims] = useState(initialClaims);
  const [loadingAppId, setLoadingAppId] = useState<string | null>(null);
  const [loadingClaimId, setLoadingClaimId] = useState<string | null>(null);
  const [errorAppId, setErrorAppId] = useState<string | null>(null);
  const [errorClaimId, setErrorClaimId] = useState<string | null>(null);

  async function updateApplicationStatus(id: string, status: ApplicationStatus) {
    setLoadingAppId(id);
    setErrorAppId(null);
    try {
      const res = await fetch(`${API_BASE}/applications/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      setApplications((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch {
      setErrorAppId(id);
    } finally {
      setLoadingAppId(null);
    }
  }

  async function updateClaimStatus(id: string, status: ClaimStatus) {
    setLoadingClaimId(id);
    setErrorClaimId(null);
    try {
      const res = await fetch(`${API_BASE}/claims/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      setClaims((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch {
      setErrorClaimId(id);
    } finally {
      setLoadingClaimId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Agent Workspace</h1>
        <p className="text-zinc-400 mt-1">Review applications and investigate claims.</p>
      </div>

      {/* Demo notice */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>
          <strong>Demo mode:</strong> Status actions are visible to all users until authentication is implemented. Changes are persisted to the database.
        </span>
      </div>

      {/* Applications Table */}
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
                <th className="px-6 py-3 font-medium">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {applications.map((app: any) => (
                <tr key={app.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white font-mono">#{app.id.substring(0, 8)}</div>
                    <div className="text-xs text-zinc-500">{new Date(app.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-zinc-300">{app.product?.name ?? app.productId.substring(0, 8) + '…'}</div>
                    <div className="text-xs text-zinc-500">{app.product?.company?.name ?? ''}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {(app.riskAssessments?.[0]?.riskScore ?? 0) > 70 ? (
                        <ShieldAlert className="h-4 w-4 text-red-500 mr-2" />
                      ) : (app.riskAssessments?.[0]?.riskScore ?? 0) > 40 ? (
                        <TrendingUp className="h-4 w-4 text-yellow-500 mr-2" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-emerald-500 mr-2" />
                      )}
                      <span className={`text-sm font-medium ${
                        (app.riskAssessments?.[0]?.riskScore ?? 0) > 70 ? 'text-red-400' :
                        (app.riskAssessments?.[0]?.riskScore ?? 0) > 40 ? 'text-yellow-400' : 'text-emerald-400'
                      }`}>
                        {app.riskAssessments?.[0]?.riskScore ?? 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={app.status} colorMap={appStatusColors} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {loadingAppId === app.id ? (
                      <span className="flex items-center gap-1 text-zinc-400 text-xs">
                        <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                      </span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <select
                          defaultValue={app.status}
                          onChange={(e) => updateApplicationStatus(app.id, e.target.value as ApplicationStatus)}
                          className="text-xs bg-zinc-950 border border-zinc-700 text-white rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer hover:border-zinc-500 transition-colors"
                        >
                          {APPLICATION_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        {errorAppId === app.id && (
                          <span className="text-[10px] text-red-400 flex items-center gap-0.5">
                            <AlertCircle className="h-3 w-3" /> Update failed
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {applications.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500 text-sm">No applications found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Claims Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
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
                <th className="px-6 py-3 font-medium">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {claims.map((claim: any) => {
                const fraudScore = claim.fraudAssessments?.[0]?.fraudScore ?? 0;
                return (
                  <tr key={claim.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white font-mono">#{claim.id.substring(0, 8)}</div>
                      <div className="text-xs text-zinc-500">{new Date(claim.createdAt ?? Date.now()).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">${claim.amount.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {fraudScore > 75 ? (
                        <span className="bg-red-500/10 text-red-400 px-2 py-1 rounded text-xs font-bold border border-red-500/20 flex items-center w-fit">
                          <ShieldAlert className="w-3 h-3 mr-1" /> High ({fraudScore})
                        </span>
                      ) : fraudScore > 40 ? (
                        <span className="bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded text-xs font-bold border border-yellow-500/20 w-fit">
                          Med ({fraudScore})
                        </span>
                      ) : (
                        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-xs font-bold border border-emerald-500/20 w-fit">
                          Low ({fraudScore})
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={claim.status} colorMap={claimStatusColors} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {loadingClaimId === claim.id ? (
                        <span className="flex items-center gap-1 text-zinc-400 text-xs">
                          <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                        </span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <select
                            defaultValue={claim.status}
                            onChange={(e) => updateClaimStatus(claim.id, e.target.value as ClaimStatus)}
                            className="text-xs bg-zinc-950 border border-zinc-700 text-white rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer hover:border-zinc-500 transition-colors"
                          >
                            {CLAIM_STATUSES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          {errorClaimId === claim.id && (
                            <span className="text-[10px] text-red-400 flex items-center gap-0.5">
                              <AlertCircle className="h-3 w-3" /> Update failed
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {claims.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500 text-sm">No claims found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
