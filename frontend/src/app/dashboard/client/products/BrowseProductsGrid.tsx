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
  company?: { id: string; name: string } | null;
};

const TYPE_STYLES: Record<string, string> = {
  AUTO: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  HEALTH: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  LIFE: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  PROPERTY: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
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
                  TYPE_STYLES[type] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}
              >
                {type}
              </span>
              <h2 className="text-lg font-semibold text-white">
                {TYPE_LABELS[type] ?? type}
              </h2>
              <span className="text-xs text-zinc-600 font-mono">{products.length} products</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors flex flex-col gap-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="h-10 w-10 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
                      <Package className="h-5 w-5 text-indigo-400" />
                    </div>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${
                        TYPE_STYLES[product.type] ??
                        'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      {product.type}
                    </span>
                  </div>

                  <div className="flex-1">
                    <h3 className="font-bold text-white text-base leading-tight">
                      {product.name}
                    </h3>
                    {product.company && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Building2 className="h-3 w-3 text-zinc-500" />
                        <p className="text-xs text-zinc-500">{product.company.name}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-zinc-800/50">
                    <div className="flex items-baseline justify-between mb-3">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                        Base premium
                      </span>
                      <div className="text-right">
                        <span className="text-xl font-bold text-emerald-400">
                          {formatCurrency(product.basePremium)}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-bold ml-1">/ mo</span>
                      </div>
                    </div>
                    <button
                      onClick={() => submitApplication(product.id)}
                      disabled={applyingProductId !== null}
                      data-testid="apply-product"
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-xs font-bold text-white transition-colors flex items-center justify-center gap-1.5"
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
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
