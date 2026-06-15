'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/i18n/LocaleProvider';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Approve a tenant pending KYC verification. Calls POST /companies/:id/approve
 * which flips the Company.status from PENDING_VERIFICATION to ACTIVE on the
 * backend. After success we refresh the server-rendered list so the row
 * moves from the "Pending" section into "Active Tenants".
 */
export default function ApproveCompanyButton({
  companyId,
  companyName,
}: {
  companyId: string;
  companyName: string;
}) {
  const { t } = useT();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) {
        toast.error(t('finale.sessionExpiredSignIn'));
        return;
      }
      const res = await fetch(`${API_URL}/companies/${companyId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to approve company');
      }
      toast.success(`Approved ${companyName}`, {
        description: 'Tenant is now ACTIVE and can create products.',
      });
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to approve company',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleApprove}
      disabled={loading}
      data-testid={`approve-company-${companyId}`}
      className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed text-sm font-bold text-white transition-colors shadow-md"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <CheckCircle2 className="h-4 w-4" />
          {t('finale.approveBtn')}
        </>
      )}
    </button>
  );
}
