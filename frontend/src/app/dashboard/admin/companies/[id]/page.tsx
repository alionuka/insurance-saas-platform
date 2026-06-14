import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, Package, ShieldCheck, Activity, DollarSign, Info } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/formatDate';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchWithToken(endpoint: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value ?? '';
  if (!token) return { status: 401 };

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });
    if (res.status === 401) return { status: 401 };
    if (res.status === 403) return { status: 403 };
    if (res.status === 404) return { status: 404 };
    if (!res.ok) return { status: 500 };
    
    // Some endpoints return { items: [...] }, others might just return the object.
    const data = await res.json();
    return { status: 200, data };
  } catch {
    return { status: 500 };
  }
}

export default async function AdminCompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Fetch data in parallel
  const [compRes, prodRes, polRes, claimRes] = await Promise.all([
    fetchWithToken(`/companies/${id}`),
    fetchWithToken('/products'),
    fetchWithToken('/policies'),
    fetchWithToken('/claims')
  ]);

  if (compRes.status === 401) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
        <p className="mt-4 text-slate-600 dark:text-slate-400">Session expired. Redirecting...</p>
      </div>
    );
  }

  if (compRes.status === 403 || compRes.status === 404) {
    notFound();
  }

  if (compRes.status !== 200 || !compRes.data) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
        <h2 className="text-lg font-semibold">Error Loading Company</h2>
        <p className="text-sm mt-1">We couldn't fetch the company details. Please try again later.</p>
      </div>
    );
  }

  const company = compRes.data;
  
  // Extract lists (assuming they return { items: [...] } based on existing patterns)
  const allProducts = prodRes.data?.items ?? [];
  const allPolicies = polRes.data?.items ?? [];
  const allClaims = claimRes.data?.items ?? [];

  // Filter for this company
  const companyProducts = allProducts.filter((p: any) => p.companyId === id);
  const productIds = new Set(companyProducts.map((p: any) => p.id));
  
  const companyPolicies = allPolicies.filter((p: any) => productIds.has(p.productId));
  const activePolicies = companyPolicies.filter((p: any) => p.status === 'ACTIVE');
  
  const companyClaims = allClaims.filter((c: any) => {
    // claims often have application -> product -> companyId, or just policy -> product -> companyId
    // We check if it maps to one of our products.
    const pId = c.application?.productId || c.policy?.productId;
    return productIds.has(pId);
  });
  const openClaims = companyClaims.filter((c: any) => c.status === 'FILED' || c.status === 'IN_PROGRESS');

  const totalPremium = activePolicies.reduce((acc: number, p: any) => acc + (p.premiumAmount || 0), 0);

  return (
    <div className="max-w-5xl space-y-6">
      <Link 
        href="/dashboard/admin/companies"
        className="inline-flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-700 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Companies
      </Link>

      {/* Hero */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 flex items-start gap-4 shadow-xl">
        <div className="h-16 w-16 rounded-2xl bg-blue-700/10 border border-blue-700/20 flex items-center justify-center shrink-0">
          <Building2 className="h-8 w-8 text-blue-700" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{company.name}</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Tenant since {formatDate(company.createdAt)}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-700">
            <Package className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Products</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{companyProducts.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-700">
            <ShieldCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Policies</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{activePolicies.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-700">
            <Activity className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Open Claims</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{openClaims.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-700">
            <DollarSign className="h-5 w-5 text-slate-700 dark:text-slate-300" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Premium</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{formatCurrency(totalPremium)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <Info className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Company Info</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Name</p>
                <p className="text-slate-900 dark:text-slate-100 font-medium mt-1">{company.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Description</p>
                <p className="text-slate-700 dark:text-slate-300 mt-1 text-sm leading-relaxed">
                  {company.description || <span className="italic text-slate-500 dark:text-slate-400">No description provided.</span>}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Registration Date</p>
                <p className="text-slate-700 dark:text-slate-300 mt-1 text-sm">{formatDate(company.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Products List */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-md">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Registered Products</h2>
              <span className="bg-blue-700/10 text-blue-700 text-xs px-2.5 py-1 rounded-full font-medium">
                {companyProducts.length} Total
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-[#060b1a] text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Product Name</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3 text-right">Base Premium</th>
                    <th className="px-6 py-3 text-right">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {companyProducts.length > 0 ? (
                    companyProducts.map((prod: any) => (
                      <tr key={prod.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                          {prod.name}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700">
                            {prod.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-blue-700">
                          {formatCurrency(prod.basePremium)}
                        </td>
                        <td className="px-6 py-4 text-right text-slate-500 dark:text-slate-400 font-mono text-xs">
                          {formatDate(prod.createdAt)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 text-sm italic">
                        No products registered for this company.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
