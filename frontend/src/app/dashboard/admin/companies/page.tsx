import { cookies } from 'next/headers';
import Link from 'next/link';
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
            <div className="w-full text-left text-sm min-w-[800px] flex flex-col">
              <div className="bg-zinc-950 text-zinc-500 uppercase text-[10px] font-bold tracking-wider grid grid-cols-5 px-6 py-3 border-b border-zinc-800">
                <div className="col-span-1">Name</div>
                <div className="col-span-1">Description</div>
                <div className="col-span-1 text-center">Active Products</div>
                <div className="col-span-1 text-center">Active Policies</div>
                <div className="col-span-1 text-right">Created At</div>
              </div>
              <div className="divide-y divide-zinc-800 flex flex-col">
                {companies.map((company: any) => (
                  <Link 
                    href={`/dashboard/admin/companies/${company.id}`}
                    key={company.id} 
                    className="grid grid-cols-5 hover:bg-zinc-800/30 hover:border-zinc-700 transition-colors items-center px-6 py-4 group"
                  >
                    <div className="col-span-1 font-bold text-white group-hover:text-indigo-400 transition-colors">
                      {company.name}
                    </div>
                    <div className="col-span-1 text-zinc-400 max-w-xs truncate">
                      {company.description || '—'}
                    </div>
                    <div className="col-span-1 text-center">
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
                        {company._count?.products ?? company.products?.length ?? 0}
                      </span>
                    </div>
                    <div className="col-span-1 text-center">
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                        {company._count?.policies ?? company.policies?.length ?? 0}
                      </span>
                    </div>
                    <div className="col-span-1 text-right text-zinc-500 font-mono text-xs">
                      {formatDate(company.createdAt)}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
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
