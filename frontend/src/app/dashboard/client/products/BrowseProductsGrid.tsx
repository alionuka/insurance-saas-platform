'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Package, FileCheck, Loader2, Building2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatDate';
import { logout } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type Product = {
  id: string;
  name: string;
  type: string;
  basePremium: number;
  company?: {
    id: string;
    name: string;
    logoUrl?: string | null;
    primaryColor?: string | null;
  } | null;
};

const TYPE_STYLES: Record<string, string> = {
  AUTO: 'bg-blue-700/10 text-blue-700 border-blue-700/20',
  HEALTH: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  LIFE: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  PROPERTY: 'bg-blue-700/10 text-blue-700 border-blue-700/20',
  TRAVEL: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

const TYPE_LABELS: Record<string, string> = {
  AUTO: 'Auto Insurance',
  HEALTH: 'Health Insurance',
  LIFE: 'Life Insurance',
  PROPERTY: 'Property Insurance',
  TRAVEL: 'Travel Insurance',
  OTHER: 'Other',
};

export default function BrowseProductsGrid({
  groupedProducts,
  typeOrder,
}: {
  groupedProducts: Record<string, Product[]>;
  typeOrder: string[];
}) {
  const router = useRouter();
  const [applyingProductId, setApplyingProductId] = useState<string | null>(null);

  const submitApplication = async (productId: string) => {
    if (applyingProductId) return;
    setApplyingProductId(productId);

    const token =
      typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      logout();
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/applications`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          logout();
          return;
        }
        throw new Error(json.message || 'Failed to submit application');
      }
      toast.success('Application submitted', {
        description: 'Redirecting you to your application…',
      });
      router.push(`/dashboard/client/applications/${json.id}`);
    } catch (err: any) {
      toast.error('Could not submit application', {
        description: err.message || 'Please try again in a moment.',
      });
      setApplyingProductId(null);
    }
  };

  return (
    <div className="space-y-10">
      {typeOrder.map((type) => {
        const products = groupedProducts[type] ?? [];
        if (products.length === 0) return null;
        return (
          <section key={type}>
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                  TYPE_STYLES[type] ?? 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
              >
                {type}
              </span>
              <h2 className="text-lg font-semibold text-slate-900">
                {TYPE_LABELS[type] ?? type}
              </h2>
              <span className="text-xs text-slate-400 font-mono">{products.length} products</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => {
                const brandColor = product.company?.primaryColor ?? null;
                return (
                <div
                  key={product.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition-colors flex flex-col gap-4 relative overflow-hidden"
                >
                  {brandColor && (
                    <div
                      className="absolute top-0 left-0 w-full h-1"
                      style={{ backgroundColor: brandColor }}
                      aria-hidden
                    />
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="h-10 w-10 rounded-lg border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden"
                      style={{
                        backgroundColor: brandColor ? brandColor + '15' : '#09090b',
                      }}
                    >
                      {product.company?.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.company.logoUrl}
                          alt={`${product.company.name} logo`}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <Package
                          className="h-5 w-5"
                          style={{ color: brandColor ?? '#60a5fa' }}
                        />
                      )}
                    </div>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${
                        TYPE_STYLES[product.type] ??
                        'bg-slate-100 text-slate-600 border-slate-300'
                      }`}
                    >
                      {product.type}
                    </span>
                  </div>

                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 text-base leading-tight">
                      {product.name}
                    </h3>
                    {product.company && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Building2 className="h-3 w-3 text-slate-500" />
                        <p className="text-xs text-slate-500">{product.company.name}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-200/50">
                    <div className="flex items-baseline justify-between mb-3">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                        Base premium
                      </span>
                      <div className="text-right">
                        <span className="text-xl font-bold text-emerald-400">
                          {formatCurrency(product.basePremium)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold ml-1">/ mo</span>
                      </div>
                    </div>
                    <button
                      onClick={() => submitApplication(product.id)}
                      disabled={applyingProductId !== null}
                      data-testid="apply-product"
                      className="w-full py-2 px-3 rounded-xl disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed text-xs font-bold text-slate-900 transition-colors flex items-center justify-center gap-1.5 hover:opacity-90"
                      style={{
                        backgroundColor: brandColor ?? '#059669',
                      }}
                    >
                      {applyingProductId === product.id ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Submitting…</span>
                        </>
                      ) : (
                        <>
                          <FileCheck className="h-3.5 w-3.5" />
                          <span>Apply for this Product</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
