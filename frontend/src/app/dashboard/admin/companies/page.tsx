import { cookies } from 'next/headers';
import EmptyState from '@/components/ui/EmptyState';
import { Building2 } from 'lucide-react';
import { formatDate } from '@/lib/formatDate';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getCompanies() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value ?? '';
    if (!token) return [];

    const authHeader: HeadersInit = { Authorization: `Bearer ${token}` };

    const res = await fetch(`${API_URL}/companies`, { 
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

export default async function AdminCompaniesPage() {
  const companies = await getCompanies();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">All Companies</h1>
        <p className="text-zinc-400 mt-1 text-sm">Manage tenant organizations on the platform.</p>
      </div>

      {companies.length > 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[800px]">
              <thead className="bg-zinc-950 text-zinc-500 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3 text-center">Active Products</th>
                  <th className="px-6 py-3 text-center">Active Policies</th>
                  <th className="px-6 py-3 text-right">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {companies.map((company: any) => (
                  <tr key={company.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">
                      {company.name}
                    </td>
                    <td className="px-6 py-4 text-zinc-400 max-w-xs truncate">
                      {company.description || '—'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {company._count?.products ?? company.products?.length ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {company._count?.policies ?? company.policies?.length ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-500 font-mono text-xs">
                      {formatDate(company.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState 
          icon={Building2} 
          title="No companies found" 
          description="There are no companies registered on the platform." 
        />
      )}
    </div>
  );
}
