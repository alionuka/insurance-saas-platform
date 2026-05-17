'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { logout } from '@/lib/auth';

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
}

export default function ClaimSubmissionForm({ policies }: ClaimSubmissionFormProps) {
  const router = useRouter();
  const [selectedPolicyId, setSelectedPolicyId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);


  const activePolicies = policies.filter((p) => p.status === 'ACTIVE');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);


    if (!selectedPolicyId) {
      toast.error('Please select a policy');
      setIsLoading(false);
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    if (!token) {
      toast.error('Not authenticated');
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
        throw new Error(data.message || 'Failed to submit claim');
      }

      const newClaim = await response.json();
      toast.success('Claim submitted successfully');
      setAmount('');
      setDescription('');
      setSelectedPolicyId('');
      
      // Refresh the page data (Server Component will re-fetch)
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'An error occurred during submission');
    } finally {
      setIsLoading(false);
    }
  };

  if (activePolicies.length === 0) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center">
        <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
        <p className="text-zinc-400">You need an active policy before filing a claim.</p>
      </div>
    );
  }

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
      <div className="p-6 border-b border-zinc-800 flex items-center gap-2 bg-zinc-900/50">
        <Activity className="h-5 w-5 text-emerald-400" />
        <h2 className="text-xl font-semibold text-white">File a New Claim</h2>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Policy Select */}
            <div className="space-y-2">
              <label htmlFor="policy" className="text-sm font-medium text-zinc-400">Select Active Policy</label>
              <select
                id="policy"
                value={selectedPolicyId}
                onChange={(e) => setSelectedPolicyId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 outline-none transition-all appearance-none"
                required
              >
                <option value="">-- Choose a Policy --</option>
                {activePolicies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.policyNumber} - {p.product?.name} ({p.product?.company?.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium text-zinc-400">Claim Amount ($)</label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Description Textarea */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-zinc-400">Incident Description</label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe what happened..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 outline-none transition-all resize-none"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing Claim...
              </>
            ) : (
              'Submit Claim'
            )}
          </button>
        </form>
      </div>
    </section>
  );
}
