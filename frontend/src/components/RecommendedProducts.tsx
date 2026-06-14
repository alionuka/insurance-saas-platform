'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Sparkles, Loader2, AlertCircle, Package, FileCheck } from 'lucide-react';
import { logout } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface RankedProduct {
  productId: string;
  name: string;
  type: string;
  similarity: number;
}

interface RecommendationsResponse {
  recommendedProducts: string[];
  rankedProducts: RankedProduct[];
  explanation: string;
}

// Light-theme product-type pills. Soft tinted backgrounds with strong
// darker text for legibility on white/off-white surfaces.
const TYPE_STYLES: Record<string, string> = {
  AUTO: 'bg-blue-50 text-blue-700 border-blue-200',
  HEALTH: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  LIFE: 'bg-amber-50 text-amber-700 border-amber-200',
  PROPERTY: 'bg-blue-50 text-blue-700 border-blue-200',
};

export default function RecommendedProducts() {
  const router = useRouter();
  const [data, setData] = useState<RecommendationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) {
        logout();
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/recommendations/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          logout();
          return;
        }
        if (!res.ok) {
          throw new Error(`Failed to load recommendations (HTTP ${res.status})`);
        }
        const json = (await res.json()) as RecommendationsResponse;
        if (!cancelled) setData(json);
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-blue-700" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">Recommended for You</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Personalised by content-based ML model from our product catalog
          </p>
        </div>
      </div>

      <div className="p-6">
        {loading && (
          <div className="flex items-center justify-center py-10 text-slate-500 dark:text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin mr-3" />
            <span className="text-sm">Computing recommendations…</span>
          </div>
        )}

        {error && !loading && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-sm text-rose-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {data && !loading && !error && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.rankedProducts.map((product, idx) => (
                <div
                  key={product.productId}
                  className="bg-slate-50 dark:bg-[#060b1a] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="h-10 w-10 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                      <Package className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-widest">
                      #{idx + 1} match
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-tight">{product.name}</h3>
                    <span
                      className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        TYPE_STYLES[product.type] ?? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {product.type}
                    </span>
                  </div>
                  <div className="mt-auto pt-3 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Match score</span>
                      <span className="text-blue-700 font-mono font-bold">
                        {(product.similarity * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-700 rounded-full transition-all"
                        style={{ width: `${Math.min(100, product.similarity * 100)}%` }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => submitApplication(product.productId)}
                    disabled={applyingProductId !== null}
                    className="mt-3 w-full py-2 px-3 rounded-lg bg-blue-700 hover:bg-blue-800 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed text-xs font-bold text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {applyingProductId === product.productId ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Submitting…</span>
                      </>
                    ) : (
                      <>
                        <FileCheck className="h-3.5 w-3.5" />
                        <span>Apply</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-3 flex gap-2 text-xs text-slate-500 dark:text-slate-400 italic leading-relaxed">
              <Sparkles className="h-3.5 w-3.5 text-blue-700 shrink-0 mt-0.5" />
              <p>{data.explanation}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
