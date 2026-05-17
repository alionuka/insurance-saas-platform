'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, CheckCircle } from 'lucide-react';
import { formatDate } from '@/lib/formatDate';
import { logout } from '@/lib/auth';
import {
  StatusBadge,
  RiskBadge,
  StatusSelect,
  appStatusColors,
  APPLICATION_STATUSES,
  ApplicationStatus,
} from '@/components/agent/AgentSharedBadges';
import FilterPills from '@/components/ui/FilterPills';

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
    if (val === 'all') {
      router.push('/dashboard/agent/applications');
    } else {
      router.push(`/dashboard/agent/applications?status=${val}`);
    }
  };

  const filteredApplications = currentStatus === 'all' 
    ? applications 
    : applications.filter((a) => a.status === currentStatus);

  return (
    <div className="space-y-6">
      <FilterPills options={filterOptions} value={currentStatus} onChange={handleFilterChange} />

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-lg font-medium text-white">Applications Queue</h2>
          <span className="bg-indigo-500/10 text-indigo-400 text-xs px-2.5 py-1 rounded-full font-medium">
            {filteredApplications.length} total
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
              {filteredApplications.map((app: any) => {
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
              {filteredApplications.length === 0 && (
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
    </div>
  );
}
