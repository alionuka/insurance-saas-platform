'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Loader2, AlertCircle, Package } from 'lucide-react';
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

const TYPE_STYLES: Record<string, string> = {
  AUTO: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  HEALTH: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  LIFE: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  PROPERTY: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export default function RecommendedProducts() {
  const [data, setData] = useState<RecommendationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white leading-tight">Recommended for You</h2>
          <p className="text-xs text-zinc-500 mt-0.5 font-medium">
            Personalised by content-based ML model from our product catalog
          </p>
        </div>
      </div>

      <div className="p-6">
        {loading && (
          <div className="flex items-center justify-center py-10 text-zinc-500">
            <Loader2 className="h-6 w-6 animate-spin mr-3" />
            <span className="text-sm">Computing recommendations…</span>
          </div>
        )}

        {error && !loading && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-sm text-rose-400">
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
                  className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                      <Package className="h-5 w-5 text-zinc-400" />
                    </div>
                    <span className="text-[9px] uppercase font-bold text-zinc-600 tracking-widest">
                      #{idx + 1} match
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base leading-tight">{product.name}</h3>
                    <span
                      className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        TYPE_STYLES[product.type] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      {product.type}
                    </span>
                  </div>
                  <div className="mt-auto pt-3 border-t border-zinc-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500 font-medium">Match score</span>
                      <span className="text-purple-400 font-mono font-bold">
                        {(product.similarity * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, product.similarity * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 flex gap-2 text-xs text-zinc-500 italic leading-relaxed">
              <Sparkles className="h-3.5 w-3.5 text-purple-400 shrink-0 mt-0.5" />
              <p>{data.explanation}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
