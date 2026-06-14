import { cookies } from 'next/headers';
import Link from 'next/link';
import EmptyState from '@/components/ui/EmptyState';
import {
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Globe,
  FileCheck,
} from 'lucide-react';
import { formatDate } from '@/lib/formatDate';
import ApproveCompanyButton from './ApproveCompanyButton';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type Company = {
  id: string;
  name: string;
  description?: string | null;
  status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED';
  licenseNumber?: string | null;
  country?: string | null;
  contactPhone?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  products?: any[];
  _count?: { products?: number; policies?: number };
};

async function getCompanies(): Promise<Company[]> {
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
  const pending = companies.filter((c) => c.status === 'PENDING_VERIFICATION');
  const active = companies.filter((c) => c.status === 'ACTIVE');
  const suspended = companies.filter((c) => c.status === 'SUSPENDED');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          All Companies
        </h1>
        <p className="text-zinc-400 mt-1 text-sm">
          Manage tenant organizations on the platform — review KYC submissions,
          approve onboarding, and audit existing tenants.
        </p>
      </div>

      {/* Pending verification queue — surfaces first because this is the
          actionable section for the platform admin */}
      {pending.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">
              Pending Verification
            </h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {pending.length}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mb-4">
            New tenants awaiting KYC review. In production these would
            require compliance team sign-off; for this thesis demo a single
            click here flips the tenant to ACTIVE.
          </p>

          <div className="space-y-3">
            {pending.map((company) => (
              <div
                key={company.id}
                className="bg-zinc-900 border border-blue-500/30 rounded-xl p-5 shadow-lg"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                      <Building2 className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-lg truncate">
                        {company.name}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Submitted {formatDate(company.createdAt)}
                      </p>
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <FileCheck className="h-3 w-3 text-zinc-600 shrink-0" />
                          <span className="text-zinc-500">Licence:</span>
                          <span className="text-white font-mono truncate">
                            {company.licenseNumber || '—'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <Globe className="h-3 w-3 text-zinc-600 shrink-0" />
                          <span className="text-zinc-500">Country:</span>
                          <span className="text-white font-mono">
                            {company.country || '—'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-400 min-w-0">
                          <Phone className="h-3 w-3 text-zinc-600 shrink-0" />
                          <span className="text-zinc-500">Phone:</span>
                          <span className="text-white font-mono truncate">
                            {company.contactPhone || '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <ApproveCompanyButton companyId={company.id} companyName={company.name} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Active tenants — main directory */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">Active Tenants</h2>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {active.length}
          </span>
        </div>

        {active.length > 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-0 overflow-x-auto">
              <div className="w-full text-left text-sm min-w-[800px] flex flex-col">
                <div className="bg-zinc-950 text-zinc-500 uppercase text-[10px] font-bold tracking-wider grid grid-cols-6 px-6 py-3 border-b border-zinc-800">
                  <div className="col-span-2">Name</div>
                  <div className="col-span-1">Country</div>
                  <div className="col-span-1 text-center">Products</div>
                  <div className="col-span-1 text-center">Status</div>
                  <div className="col-span-1 text-right">Created</div>
                </div>
                <div className="divide-y divide-zinc-800 flex flex-col">
                  {active.map((company) => (
                    <Link
                      href={`/dashboard/admin/companies/${company.id}`}
                      key={company.id}
                      className="grid grid-cols-6 hover:bg-zinc-800/30 hover:border-zinc-700 transition-colors items-center px-6 py-4 group"
                    >
                      <div className="col-span-2 font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                        {company.name}
                      </div>
                      <div className="col-span-1 text-zinc-400 font-mono text-xs">
                        {company.country || '—'}
                      </div>
                      <div className="col-span-1 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {company.products?.length ?? 0}
                        </span>
                      </div>
                      <div className="col-span-1 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          Active
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
            title="No active tenants yet"
            description="Approved companies will appear here."
          />
        )}
      </section>

      {/* Suspended (rare, but show if any) */}
      {suspended.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-rose-400" />
            <h2 className="text-lg font-semibold text-white">Suspended</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              {suspended.length}
            </span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-400">
            {suspended.map((c) => (
              <div key={c.id} className="py-1">
                {c.name} —{' '}
                <span className="text-zinc-600 text-xs">
                  suspended {formatDate(c.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
