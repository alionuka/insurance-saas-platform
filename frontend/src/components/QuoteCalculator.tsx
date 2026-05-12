'use client';

import React, { useState } from 'react';
import { Calculator, Loader2, AlertCircle, TrendingUp, ShieldCheck, DollarSign, ChevronRight, Info } from 'lucide-react';
import { logout } from '@/lib/auth';

interface Product {
  id: string;
  name: string;
  type: string;
  basePremium: number;
}

interface QuoteResponse {
  productId: string;
  productName: string;
  basePremium: number;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  riskMultiplier: number;
  monthlyPremium: number;
  explanation: string;
}

interface QuoteCalculatorProps {
  products: Product[];
}

export default function QuoteCalculator({ products }: QuoteCalculatorProps) {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProductId(e.target.value);
    setQuote(null);
    setError(null);
  };

  const calculateQuote = async () => {
    if (!selectedProductId) return;

    setLoading(true);
    setError(null);
    setQuote(null);

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      logout();
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/products/${selectedProductId}/quote`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          return;
        }
        throw new Error(data.message || 'Failed to calculate quote');
      }

      setQuote(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during calculation');
    } finally {
      setLoading(false);
    }
  };

  const getRiskStyles = (level: string) => {
    switch (level) {
      case 'LOW':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'HIGH':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Calculator className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">Personalized Quote</h2>
            <p className="text-xs text-zinc-500 mt-0.5 font-medium">Compare insurance pricing based on your profile</p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="product-select" className="block text-sm font-semibold text-zinc-400 mb-2">
              Insurance Product
            </label>
            <select
              id="product-select"
              value={selectedProductId}
              onChange={handleProductChange}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer appearance-none"
            >
              <option value="">-- Select a product --</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.type}) — from ${product.basePremium}/mo
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={calculateQuote}
            disabled={!selectedProductId || loading}
            className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20 active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Calculating...</span>
              </>
            ) : (
              <>
                <Calculator className="h-5 w-5" />
                <span>Calculate My Premium</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-sm text-rose-400 animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {quote && (
          <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-6 animate-in zoom-in-95 fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1">Your Monthly Premium</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-emerald-400 tracking-tight">
                    ${quote.monthlyPremium.toFixed(2)}
                  </span>
                  <span className="text-zinc-500 font-bold text-sm">/ month</span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-2 font-medium bg-zinc-900 px-2 py-1 rounded-md inline-block">
                  Base ${quote.basePremium} × {quote.riskMultiplier.toFixed(2)} risk multiplier
                </p>
              </div>
              
              <div className="flex flex-col items-start sm:items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getRiskStyles(quote.riskLevel)}`}>
                  {quote.riskLevel} RISK
                </span>
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-bold">
                  <TrendingUp className="h-3 w-3" />
                  Risk score: {quote.riskScore}/100
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800 flex gap-3">
              <Info className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-400 leading-relaxed italic">
                "{quote.explanation}"
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
