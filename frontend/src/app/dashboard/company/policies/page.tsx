import { cookies } from 'next/headers';
import EmptyState from '@/components/ui/EmptyState';
import { ShieldCheck } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/formatDate';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getPolicies() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value ?? '';
    if (!token) return [];

    const authHeader: HeadersInit = { Authorization: `Bearer ${token}` };

    const res = await fetch(`${API_URL}/policies`, { 
      cache: 'no-store',
      headers: authHeader,
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items ?? [];
  } catch {
    return [];
  }
}

export default async function CompanyPoliciesPage() {
  const policies = await getPolicies();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Company Policies</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">Active policies issued by your company.</p>
      </div>

      {policies.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[800px]">
              <thead className="bg-slate-50 dark:bg-[#060b1a] text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-3">Policy Number</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Start Date</th>
                  <th className="px-6 py-3 text-right">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {policies.map((policy: any) => (
                  <tr key={policy.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-slate-100 uppercase">
                      {policy.policyNumber}
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">
                      {policy.user?.firstName} {policy.user?.lastName}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {policy.product?.name}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${
                        policy.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' : 
                        policy.status === 'PENDING_PAYMENT' ? 'bg-blue-700/10 text-blue-700 border-blue-700/20' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                      }`}>
                        {policy.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-500 dark:text-slate-400 font-mono text-xs">
                      {formatDate(policy.startDate)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {formatCurrency(policy.premiumAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState 
          icon={ShieldCheck} 
          title="No policies found" 
          description="There are no active policies for your company." 
        />
      )}
    </div>
  );
}
