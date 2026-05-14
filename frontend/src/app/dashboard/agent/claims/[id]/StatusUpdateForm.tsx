'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { logout } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const CLAIM_STATUSES = ['FILED', 'IN_PROGRESS', 'APPROVED', 'DENIED'];

export default function StatusUpdateForm({ claimId, currentStatus }: { claimId: string; currentStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === currentStatus) return;

    setLoading(true);
    setError(false);
    setSuccess(false);

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      setError(true);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/claims/${claimId}/status`, {
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

      if (!res.ok) throw new Error('Failed to update status');

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 md:p-8">
      <h2 className="text-lg font-semibold text-white mb-4">Update Claim Status</h2>
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">
            Current Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={loading}
            className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            {CLAIM_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={loading || status === currentStatus}
          className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 min-w-[140px]"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Updating...</>
          ) : (
            'Update Status'
          )}
        </button>
      </div>
      
      {error && (
        <div className="mt-4 flex items-center gap-2 text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          Failed to update claim status. Please try again.
        </div>
      )}
      
      {success && (
        <div className="mt-4 flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg">
          <CheckCircle className="h-4 w-4" />
          Status updated successfully.
        </div>
      )}
    </form>
  );
}
