'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { logout } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const STATUS_OPTIONS = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'] as const;

export default function ApplicationStatusUpdateForm({ 
  applicationId, 
  currentStatus 
}: { 
  applicationId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(currentStatus);

  async function handleUpdate() {
    if (status === currentStatus) return;

    setIsLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status }),
      });

      if (res.status === 401) {
        logout();
        window.location.href = '/auth/sign-in';
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update status (${res.status})`);
      }

      toast.success(`Application status updated to ${status.replace('_', ' ')}`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'An unexpected error occurred');
      setStatus(currentStatus); // Revert on error
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        disabled={isLoading}
        className="bg-zinc-950 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 cursor-pointer"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt.replace('_', ' ')}
          </option>
        ))}
      </select>
      
      <button
        onClick={handleUpdate}
        disabled={isLoading || status === currentStatus}
        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center min-w-[80px]"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update'}
      </button>
    </div>
  );
}
