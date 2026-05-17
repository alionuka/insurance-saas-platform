'use client';

import {
  ShieldAlert,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export const APPLICATION_STATUSES = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'] as const;
export const CLAIM_STATUSES = ['FILED', 'IN_PROGRESS', 'APPROVED', 'DENIED'] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export const appStatusColors: Record<ApplicationStatus, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  UNDER_REVIEW: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export const claimStatusColors: Record<ClaimStatus, string> = {
  FILED: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  DENIED: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export function StatusBadge({
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

export function RiskBadge({ score, level }: { score: number | null; level: string | null }) {
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

export function FraudBadge({ score, flag }: { score: number | null; flag: string | null }) {
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

export function StatusSelect<T extends string>({
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
