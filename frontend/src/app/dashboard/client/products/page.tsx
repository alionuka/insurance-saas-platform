import { Package } from 'lucide-react';
import { cookies } from 'next/headers';
import BrowseProductsGrid from './BrowseProductsGrid';
import { getT } from '@/i18n/getT';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type Product = {
  id: string;
  name: string;
  type: string;
  basePremium: number;
  company?: { id: string; name: string } | null;
};

async function getAllProducts(): Promise<Product[]> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value ?? '';
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    const res = await fetch(`${API_URL}/products?limit=100`, {
      cache: 'no-store',
      headers,
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items ?? [];
  } catch {
    return [];
  }
}

export default async function BrowseProductsPage() {
  const products = await getAllProducts();
  const { t } = await getT();

  // Group by type so the catalog feels organized at a glance
  const grouped = products.reduce<Record<string, Product[]>>((acc, p) => {
    const key = p.type || 'OTHER';
    (acc[key] ??= []).push(p);
    return acc;
  }, {});

  const typeOrder = ['HEALTH', 'AUTO', 'LIFE', 'PROPERTY', 'TRAVEL', 'OTHER'];
  const sortedTypes = Object.keys(grouped).sort(
    (a, b) => typeOrder.indexOf(a) - typeOrder.indexOf(b)
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
          <Package className="h-7 w-7 text-blue-700" />
          {t('clientProducts.title')}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">
          {t('clientProducts.subtitle')}
        </p>
      </div>

      {products.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-dashed rounded-2xl p-12 text-center">
          <Package className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">{t('clientProducts.empty')}</p>
        </div>
      ) : (
        <BrowseProductsGrid groupedProducts={grouped} typeOrder={sortedTypes} />
      )}
    </div>
  );
}
