'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, CheckCircle, XCircle } from 'lucide-react';
import { formatDate } from '@/lib/formatDate';
import { logout } from '@/lib/auth';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  StatusBadge,
  RiskBadge,
  StatusSelect,
  appStatusColors,
  APPLICATION_STATUSES,
  ApplicationStatus,
} from '@/components/agent/AgentSharedBadges';
import FilterPills from '@/components/ui/FilterPills';
import BulkActionBar from '@/components/BulkActionBar';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function ApplicationsTable({
  initialApplications,
}: {
  initialApplications: any[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get('status') || 'all';

  const [applications, setApplications] = useState<any[]>(initialApplications);
  const [loadingAppId, setLoadingAppId] = useState<string | null>(null);
  const [errorAppIds, setErrorAppIds] = useState<Set<string>>(new Set());
  const [successAppId, setSuccessAppId] = useState<string | null>(null);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  async function updateApplicationStatus(id: string, status: ApplicationStatus) {
    setLoadingAppId(id);
    setErrorAppIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    setSuccessAppId(null);
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      setErrorAppIds((prev) => new Set(prev).add(id));
      setLoadingAppId(null);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/applications/${id}/status`, {
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
      setApplications((prev) => prev.map((a) => (a.id === id ? updated : a)));
      setSuccessAppId(id);
      setTimeout(() => setSuccessAppId(null), 2500);
    } catch {
      setErrorAppIds((prev) => new Set(prev).add(id));
    } finally {
      setLoadingAppId(null);
    }
  }

  async function bulkUpdateStatus(status: ApplicationStatus) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      toast.error('Not authenticated');
      return;
    }

    setIsBulkProcessing(true);
    const ids = Array.from(selectedIds);

    const results = await Promise.allSettled(
      ids.map((id) =>
        fetch(`${API_BASE}/applications/${id}/status`, {
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
    const label = status === 'APPROVED' ? 'approved' : status === 'REJECTED' ? 'rejected' : 'updated';

    if (failed === 0) {
      toast.success(`${succeeded} application${succeeded !== 1 ? 's' : ''} ${label}`);
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
    if (selectedIds.size === filteredApplications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredApplications.map((a: any) => a.id)));
    }
  }

  // Calculate counts for filters based on current internal state
  const counts = applications.reduce((acc: any, app: any) => {
    acc['all'] = (acc['all'] || 0) + 1;
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, { all: 0 });

  const filterOptions = [
    { value: 'all', label: 'All', count: counts['all'] },
    { value: 'PENDING', label: 'Pending', count: counts['PENDING'] || 0 },
    { value: 'APPROVED', label: 'Approved', count: counts['APPROVED'] || 0 },
    { value: 'REJECTED', label: 'Rejected', count: counts['REJECTED'] || 0 },
    { value: 'UNDER_REVIEW', label: 'Under Review', count: counts['UNDER_REVIEW'] || 0 },
  ];

  const handleFilterChange = (val: string) => {
    setSelectedIds(new Set());
    if (val === 'all') {
      router.push('/dashboard/agent/applications');
    } else {
      router.push(`/dashboard/agent/applications?status=${val}`);
    }
  };

  const filteredApplications = currentStatus === 'all' 
    ? applications 
    : applications.filter((a) => a.status === currentStatus);

  const allSelected = filteredApplications.length > 0 && selectedIds.size === filteredApplications.length;

  return (
    <div className="space-y-6">
      <FilterPills options={filterOptions} value={currentStatus} onChange={handleFilterChange} />

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-lg font-medium text-white">Applications Queue</h2>
          <span className="bg-teal-500/10 text-teal-400 text-xs px-2.5 py-1 rounded-full font-medium">
            {filteredApplications.length} total
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-zinc-950/50 border-b border-zinc-800 text-xs uppercase text-zinc-500 tracking-wider">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-teal-500 focus:ring-teal-500/20 focus:ring-offset-0 cursor-pointer accent-teal-500"
                  />
                </th>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Product / Company</th>
                <th className="px-6 py-3 font-medium">Risk</th>
                <th className="px-6 py-3 font-medium">Current Status</th>
                <th className="px-6 py-3 font-medium">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredApplications.map((app: any) => {
                const risk = app.riskAssessments?.[0] ?? null;
                const isSelected = selectedIds.has(app.id);
                return (
                  <tr
                    key={app.id}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-teal-500/5'
                        : successAppId === app.id
                        ? 'bg-emerald-500/5'
                        : 'hover:bg-zinc-800/50'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(app.id)}
                        className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-teal-500 focus:ring-teal-500/20 focus:ring-offset-0 cursor-pointer accent-teal-500"
                      />
                    </td>

                    {/* Customer */}
                    <td className="px-6 py-4 whitespace-nowrap min-w-[250px]">
                      <Link href={`/dashboard/agent/applications/${app.id}`} className="block group">
                        <div className="flex items-center gap-2 group-hover:bg-zinc-800/50 p-2 -m-2 rounded-lg transition-colors">
                          <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 group-hover:border-zinc-600 transition-colors">
                            <User className="h-4 w-4 text-zinc-400 group-hover:text-zinc-300" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white group-hover:text-teal-400 transition-colors">
                              {app.user
                                ? `${app.user.firstName} ${app.user.lastName}`
                                : `#${app.id.substring(0, 8)}`}
                            </div>
                            <div className="text-xs text-zinc-500 mt-0.5">
                              {formatDate(app.createdAt)}
                            </div>
                          </div>
                        </div>
                      </Link>
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
              {filteredApplications.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-zinc-500 text-sm">
                    No applications found.
                  </td>
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
            label: 'Reject All',
            variant: 'danger',
            icon: XCircle,
            onClick: () => bulkUpdateStatus('REJECTED'),
          },
        ]}
      />
    </div>
  );
}
