'use client';

import { useState, Fragment } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, CheckCircle, ChevronRight } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/formatDate';
import { logout } from '@/lib/auth';
import Link from 'next/link';
import ClaimDocuments from '@/components/ClaimDocuments';
import {
  StatusBadge,
  FraudBadge,
  StatusSelect,
  claimStatusColors,
  CLAIM_STATUSES,
  ClaimStatus,
} from '@/components/agent/AgentSharedBadges';
import FilterPills from '@/components/ui/FilterPills';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function ClaimsTable({
  initialClaims,
}: {
  initialClaims: any[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get('status') || 'all';
  const currentFraud = searchParams.get('fraud') || 'all';

  const [claims, setClaims] = useState<any[]>(initialClaims);
  const [loadingClaimId, setLoadingClaimId] = useState<string | null>(null);
  const [errorClaimIds, setErrorClaimIds] = useState<Set<string>>(new Set());
  const [successClaimId, setSuccessClaimId] = useState<string | null>(null);

  async function updateClaimStatus(id: string, status: ClaimStatus) {
    setLoadingClaimId(id);
    setErrorClaimIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    setSuccessClaimId(null);
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      setErrorClaimIds((prev) => new Set(prev).add(id));
      setLoadingClaimId(null);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/claims/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.status === 401) {
        logout();
        return;
      }
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

  // Calculate counts for filters
  const statusCounts = claims.reduce((acc: any, claim: any) => {
    acc['all'] = (acc['all'] || 0) + 1;
    acc[claim.status] = (acc[claim.status] || 0) + 1;
    return acc;
  }, { all: 0 });

  const fraudCounts = claims.reduce((acc: any, claim: any) => {
    const flag = claim.fraudAssessments?.[0]?.flag || 'NONE';
    acc['all'] = (acc['all'] || 0) + 1;
    acc[flag] = (acc[flag] || 0) + 1;
    return acc;
  }, { all: 0 });

  const statusFilterOptions = [
    { value: 'all', label: 'All Statuses', count: statusCounts['all'] },
    { value: 'FILED', label: 'Filed', count: statusCounts['FILED'] || 0 },
    { value: 'IN_PROGRESS', label: 'In Progress', count: statusCounts['IN_PROGRESS'] || 0 },
    { value: 'APPROVED', label: 'Approved', count: statusCounts['APPROVED'] || 0 },
    { value: 'DENIED', label: 'Denied', count: statusCounts['DENIED'] || 0 },
  ];

  const fraudFilterOptions = [
    { value: 'all', label: 'All Risk Levels', count: fraudCounts['all'] },
    { value: 'NORMAL', label: 'Normal', count: fraudCounts['NORMAL'] || 0 },
    { value: 'SUSPICIOUS', label: 'Suspicious', count: fraudCounts['SUSPICIOUS'] || 0 },
  ];

  const handleFilterChange = (key: string, val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val === 'all') {
      params.delete(key);
    } else {
      params.set(key, val);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    router.push(`/dashboard/agent/claims${query}`);
  };

  const filteredClaims = claims.filter((c) => {
    const matchesStatus = currentStatus === 'all' || c.status === currentStatus;
    const flag = c.fraudAssessments?.[0]?.flag || 'NONE';
    const matchesFraud = currentFraud === 'all' || flag === currentFraud;
    return matchesStatus && matchesFraud;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <FilterPills options={statusFilterOptions} value={currentStatus} onChange={(val) => handleFilterChange('status', val)} />
        <FilterPills options={fraudFilterOptions} value={currentFraud} onChange={(val) => handleFilterChange('fraud', val)} />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-lg font-medium text-white">Claims Investigation Queue</h2>
          <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-medium">
            {filteredClaims.length} total
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
              {filteredClaims.map((claim: any) => {
                const fraud = claim.fraudAssessments?.[0] ?? null;
                const policy = claim.policy ?? null;
                const product = claim.application?.product ?? null;
                const company = product?.company ?? null;

                return (
                  <Fragment key={claim.id}>
                    <tr
                      className={`transition-colors ${
                        successClaimId === claim.id
                          ? 'bg-emerald-500/5'
                          : 'hover:bg-zinc-800/50'
                      }`}
                    >
                    {/* Customer / Description */}
                    <td className="px-6 py-4 min-w-[250px]">
                      <Link href={`/dashboard/agent/claims/${claim.id}`} className="block group">
                        <div className="flex items-start gap-2 group-hover:bg-zinc-800/50 p-2 -m-2 rounded-lg transition-colors">
                          <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-zinc-600 transition-colors">
                            <User className="h-4 w-4 text-zinc-400 group-hover:text-zinc-300" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white group-hover:text-indigo-400 transition-colors">
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
                      </Link>
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
                  {/* Documents Sub-row */}
                  <tr key={`${claim.id}-docs`} className="bg-zinc-950/20">
                    <td colSpan={6} className="px-6 py-0 border-b border-zinc-800">
                      <details className="group">
                        <summary className="list-none cursor-pointer py-3 flex items-center gap-2 text-[10px] text-zinc-500 hover:text-indigo-400 uppercase font-bold tracking-tight transition-colors">
                          <ChevronRight className="h-3 w-3 group-open:rotate-90 transition-transform" />
                          Supporting Documents
                        </summary>
                        <div className="pb-6">
                          <ClaimDocuments claimId={claim.id} canUpload={false} />
                        </div>
                      </details>
                    </td>
                  </tr>
                </Fragment>
                );
              })}
              {filteredClaims.length === 0 && (
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
