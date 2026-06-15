'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Package, FileCheck, Loader2, Building2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatDate';
import { logout } from '@/lib/auth';
import { useT } from '@/i18n/LocaleProvider';

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
  AUTO: 'bg-blue-50 text-blue-700 border-blue-200',
  HEALTH: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  LIFE: 'bg-amber-50 text-amber-700 border-amber-200',
  PROPERTY: 'bg-blue-50 text-blue-700 border-blue-200',
  TRAVEL: 'bg-rose-50 text-rose-700 border-rose-200',
};

// Map a backend product type code to a localised i18n key. The label
// itself comes from `t(productTypes.<TYPE>)` so the heading flips with
// the locale; if a new code arrives that we haven't translated yet, we
// fall back to the raw code so nothing silently disappears.
const TYPE_LABEL_KEYS: Record<string, string> = {
  AUTO: 'productTypes.AUTO',
  HEALTH: 'productTypes.HEALTH',
  LIFE: 'productTypes.LIFE',
  PROPERTY: 'productTypes.PROPERTY',
  TRAVEL: 'productTypes.TRAVEL',
  OTHER: 'productTypes.OTHER',
};

export default function BrowseProductsGrid({
  groupedProducts,
  typeOrder,
}: {
  groupedProducts: Record<string, Product[]>;
  typeOrder: string[];
}) {
  const { t } = useT();
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
        throw new Error(json.message || t('recommendations.submitFailed'));
      }
      toast.success(t('recommendations.submitted'), {
        description: t('recommendations.submittedDesc'),
      });
      router.push(`/dashboard/client/applications/${json.id}`);
    } catch (err: any) {
      toast.error(t('recommendations.submitFailed'), {
        description: err.message || t('recommendations.submitFailedDesc'),
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
                  TYPE_STYLES[type] ?? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                }`}
              >
                {type}
              </span>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {TYPE_LABEL_KEYS[type] ? t(TYPE_LABEL_KEYS[type]) : type}
              </h2>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">{products.length} {t('productTypes.productsSuffix')}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => {
                const brandColor = product.company?.primaryColor ?? null;
                return (
                <div
                  key={product.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col gap-4 relative overflow-hidden"
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
                      className={
                        // Brand tint when company has a primary color; otherwise
                        // a soft surface that adapts to the theme.
                        brandColor
                          ? 'h-10 w-10 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 overflow-hidden'
                          : 'h-10 w-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden'
                      }
                      style={
                        brandColor
                          ? { backgroundColor: brandColor + '15' }
                          : undefined
                      }
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
                          className="h-5 w-5 text-blue-700"
                          style={brandColor ? { color: brandColor } : undefined}
                        />
                      )}
                    </div>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${
                        TYPE_STYLES[product.type] ??
                        'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {product.type}
                    </span>
                  </div>

                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-tight">
                      {product.name}
                    </h3>
                    {product.company && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Building2 className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                        <p className="text-xs text-slate-500 dark:text-slate-400">{product.company.name}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800/50">
                    <div className="flex items-baseline justify-between mb-3">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{t('tail.basePremium')}</span>
                      <div className="text-right">
                        <span className="text-xl font-bold text-blue-700">
                          {formatCurrency(product.basePremium)}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold ml-1">/ mo</span>
                      </div>
                    </div>
                    <button
                      onClick={() => submitApplication(product.id)}
                      disabled={applyingProductId !== null}
                      data-testid="apply-product"
                      className="w-full py-2 px-3 rounded-xl disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed text-xs font-bold text-slate-900 dark:text-slate-100 transition-colors flex items-center justify-center gap-1.5 hover:opacity-90"
                      style={{
                        backgroundColor: brandColor ?? '#059669',
                      }}
                    >
                      {applyingProductId === product.id ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>{t('tail.submittingApp')}</span>
                        </>
                      ) : (
                        <>
                          <FileCheck className="h-3.5 w-3.5" />
                          <span>{t('tail.applyForProduct')}</span>
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
