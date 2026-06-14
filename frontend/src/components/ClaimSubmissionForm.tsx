'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { logout } from '@/lib/auth';
import { useT } from '@/i18n/LocaleProvider';

interface Policy {
  id: string;
  policyNumber: string;
  status: string;
  product?: {
    name: string;
    company?: {
      name: string;
    };
  };
}

interface ClaimSubmissionFormProps {
  policies: any[];
  preselectPolicyId?: string;
}

export default function ClaimSubmissionForm({ policies, preselectPolicyId }: ClaimSubmissionFormProps) {
  const router = useRouter();
  const { t } = useT();

  const activePolicies = policies.filter((p) => p.status === 'ACTIVE');

  // If preselectPolicyId matches an active policy, use it as the default
  const initialPolicyId = preselectPolicyId && activePolicies.some(p => p.id === preselectPolicyId)
    ? preselectPolicyId
    : '';

  const [selectedPolicyId, setSelectedPolicyId] = useState(initialPolicyId);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);


    if (!selectedPolicyId) {
      toast.error(t('clientClaims.pleaseSelectPolicy'));
      setIsLoading(false);
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    if (!token) {
      toast.error(t('clientClaims.notAuthenticated'));
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/claims`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          policyId: selectedPolicyId,
          amount: parseFloat(amount),
          description,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 401) {
          logout();
          return;
        }
        throw new Error(data.message || t('clientClaims.failedToSubmit'));
      }

      await response.json();
      toast.success(t('clientClaims.submittedSuccess'));
      setAmount('');
      setDescription('');
      setSelectedPolicyId('');

      // Refresh the page data (Server Component will re-fetch)
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('clientClaims.submitError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (activePolicies.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center">
        <AlertCircle className="h-8 w-8 text-blue-500 mx-auto mb-3" />
        <p className="text-slate-600 dark:text-slate-400">{t('clientClaims.needActivePolicy')}</p>
      </div>
    );
  }

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xl">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900/50">
        <Activity className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{t('clientClaims.fileNewClaim')}</h2>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Policy Select */}
            <div className="space-y-2">
              <label htmlFor="policy" className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('clientClaims.selectActivePolicy')}</label>
              <select
                id="policy"
                value={selectedPolicyId}
                onChange={(e) => setSelectedPolicyId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#060b1a] border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 outline-none transition-all appearance-none"
                required
              >
                <option value="">{t('clientClaims.choosePolicy')}</option>
                {activePolicies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.policyNumber} - {p.product?.name} ({p.product?.company?.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('clientClaims.claimAmount')}</label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-50 dark:bg-[#060b1a] border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Description Textarea */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('clientClaims.incidentDescription')}</label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('clientClaims.describePlaceholder')}
              className="w-full bg-slate-50 dark:bg-[#060b1a] border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 outline-none transition-all resize-none"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-slate-100 disabled:text-slate-500 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {t('clientClaims.processingClaim')}
              </>
            ) : (
              t('clientClaims.submitClaim')
            )}
          </button>
        </form>
      </div>
    </section>
  );
}
