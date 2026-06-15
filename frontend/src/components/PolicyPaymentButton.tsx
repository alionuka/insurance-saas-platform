'use client';

import { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { logout } from '@/lib/auth';
import { useT } from '@/i18n/LocaleProvider';

interface PolicyPaymentButtonProps {
  policyId: string;
  amount: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function PolicyPaymentButton({ policyId, amount }: PolicyPaymentButtonProps) {
  const { t } = useT();
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    
    if (!token) {
      logout();
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/policies/${policyId}/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.status === 401) {
        logout();
        return;
      }

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || t('tail.paymentInitFailed'));
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (err: any) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <CreditCard className="h-4 w-4" />
      )}
      {t('tail.payNow')} (${amount.toFixed(2)}{t('tail.perYear')})
    </button>
  );
}
