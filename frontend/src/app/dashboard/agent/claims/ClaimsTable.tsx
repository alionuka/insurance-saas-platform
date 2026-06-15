'use client';

import { useState, Fragment } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, CheckCircle, XCircle, ChevronRight, Clock } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/formatDate';
import { logout } from '@/lib/auth';
import Link from 'next/link';
import { toast } from 'sonner';
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
import BulkActionBar from '@/components/BulkActionBar';
import { useT } from '@/i18n/LocaleProvider';
import { translateStatus } from '@/i18n/translateStatus';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function ClaimsTable({
  initialClaims,
}: {
  initialClaims: any[];
}) {
  const router = useRouter();
  const { t } = useT();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get('status') || 'all';
  const currentFraud = searchParams.get('fraud') || 'all';

  const [claims, setClaims] = useState<any[]>(initialClaims);
  const [loadingClaimId, setLoadingClaimId] = useState<string | null>(null);
  const [errorClaimIds, setErrorClaimIds] = useState<Set<string>>(new Set());
  const [successClaimId, setSuccessClaimId] = useState<string | null>(null);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

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

  async function bulkUpdateStatus(status: ClaimStatus) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      toast.error('Not authenticated');
      return;
    }

    setIsBulkProcessing(true);
    const ids = Array.from(selectedIds);

    const results = await Promise.allSettled(
      ids.map((id) =>
        fetch(`${API_BASE}/claims/${id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }).then((res) => {
          if (res.status === 401) {
            logout();
            throw new Error('Unauthorized');
          }
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
      )
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    const label = status === 'APPROVED' ? 'approved' : status === 'DENIED' ? 'denied' : 'marked in progress';

    if (failed === 0) {
      toast.success(`${succeeded} claim${succeeded !== 1 ? 's' : ''} ${label}`);
    } else {
      toast.warning(`${succeeded} succeeded, ${failed} failed`);
    }

    setSelectedIds(new Set());
    setIsBulkProcessing(false);
    router.refresh();
  }

  function toggleSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredClaims.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredClaims.map((c: any) => c.id)));
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
    { value: 'all', label: t('filters.allStatuses'), count: statusCounts['all'] },
    { value: 'FILED', label: translateStatus(t, 'FILED'), count: statusCounts['FILED'] || 0 },
    { value: 'IN_PROGRESS', label: translateStatus(t, 'IN_PROGRESS'), count: statusCounts['IN_PROGRESS'] || 0 },
    { value: 'APPROVED', label: translateStatus(t, 'APPROVED'), count: statusCounts['APPROVED'] || 0 },
    { value: 'DENIED', label: translateStatus(t, 'DENIED'), count: statusCounts['DENIED'] || 0 },
  ];

  const fraudFilterOptions = [
    { value: 'all', label: t('filters.allRiskLevels'), count: fraudCounts['all'] },
    { value: 'NORMAL', label: t('filters.normal'), count: fraudCounts['NORMAL'] || 0 },
    { value: 'SUSPICIOUS', label: t('filters.suspicious'), count: fraudCounts['SUSPICIOUS'] || 0 },
  ];

  const handleFilterChange = (key: string, val: string) => {
    setSelectedIds(new Set());
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

  const allSelected = filteredClaims.length > 0 && selectedIds.size === filteredClaims.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <FilterPills options={statusFilterOptions} value={currentStatus} onChange={(val) => handleFilterChange('status', val)} />
        <FilterPills options={fraudFilterOptions} value={currentFraud} onChange={(val) => handleFilterChange('fraud', val)} />
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">{t('claimsTable.investigationQueue')}</h2>
          <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs px-2.5 py-1 rounded-full font-medium">
            {filteredClaims.length} {t('filters.total')}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1050px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#060b1a]/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-blue-500 focus:ring-blue-500/20 focus:ring-offset-0 cursor-pointer accent-blue-500"
                  />
                </th>
                <th className="px-6 py-3 font-medium">{t('claimsTable.colCustomer')}</th>
                <th className="px-6 py-3 font-medium">{t('claimsTable.colPolicy')}</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">{t('claimsTable.colFraud')}</th>
                <th className="px-6 py-3 font-medium">{t('claimsTable.colCurrent')}</th>
                <th className="px-6 py-3 font-medium">{t('claimsTable.colUpdate')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredClaims.map((claim: any) => {
                const fraud = claim.fraudAssessments?.[0] ?? null;
                const policy = claim.policy ?? null;
                const product = claim.application?.product ?? null;
                const company = product?.company ?? null;
                const isSelected = selectedIds.has(claim.id);

                return (
                  <Fragment key={claim.id}>
                    <tr
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-blue-700/5'
                          : successClaimId === claim.id
                          ? 'bg-emerald-500/5'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
                      }`}
                    >
                    {/* Checkbox */}
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(claim.id)}
                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-blue-500 focus:ring-blue-500/20 focus:ring-offset-0 cursor-pointer accent-blue-500"
                      />
                    </td>

                    {/* Customer / Description */}
                    <td className="px-6 py-4 min-w-[250px]">
                      <Link href={`/dashboard/agent/claims/${claim.id}`} className="block group">
                        <div className="flex items-start gap-2 group-hover:bg-slate-100/50 p-2 -m-2 rounded-lg transition-colors">
                          <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-zinc-600 transition-colors">
                            <User className="h-4 w-4 text-slate-600 dark:text-slate-400 group-hover:text-slate-700" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-700 transition-colors">
                              {claim.user
                                ? `${claim.user.firstName} ${claim.user.lastName}`
                                : `#${claim.id.substring(0, 8)}`}
                            </div>
                            <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 italic leading-relaxed">
                              &quot;{claim.description}&quot;
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-tighter">
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
                              <span className="text-sm font-mono text-blue-700 font-bold">{policy.policyNumber}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border uppercase ${
                                policy.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' : 'bg-zinc-500/10 text-slate-600 dark:text-slate-400 border-zinc-500/20'
                              }`}>
                                {translateStatus(t, policy.status)}
                              </span>
                            </div>
                            <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">{product?.name ?? '—'}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">{company?.name ?? '—'}</div>
                          </>
                        ) : (
                          <span className="text-xs text-slate-500 dark:text-slate-400 italic">{t('claimsTable.noPolicy')}</span>
                        )}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900 dark:text-slate-100 font-bold">
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
                          <div className="text-[10px] text-slate-600 dark:text-slate-400 leading-tight border-l border-slate-200 dark:border-slate-800 pl-2 italic">
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
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
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
                  <tr key={`${claim.id}-docs`} className="bg-slate-50 dark:bg-[#060b1a]/20">
                    <td colSpan={7} className="px-6 py-0 border-b border-slate-200 dark:border-slate-800">
                      <details className="group">
                        <summary className="list-none cursor-pointer py-3 flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 hover:text-blue-700 uppercase font-bold tracking-tight transition-colors">
                          <ChevronRight className="h-3 w-3 group-open:rotate-90 transition-transform" />{t('tail.supportingDocuments')}</summary>
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
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 text-sm">{t('tail.noClaimsTable')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <BulkActionBar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        isProcessing={isBulkProcessing}
        actions={[
          {
            label: 'Approve All',
            variant: 'success',
            icon: CheckCircle,
            onClick: () => bulkUpdateStatus('APPROVED'),
          },
          {
            label: 'Deny All',
            variant: 'danger',
            icon: XCircle,
            onClick: () => bulkUpdateStatus('DENIED'),
          },
          {
            label: 'Mark In Progress',
            variant: 'warning',
            icon: Clock,
            onClick: () => bulkUpdateStatus('IN_PROGRESS'),
          },
        ]}
      />
    </div>
  );
}
