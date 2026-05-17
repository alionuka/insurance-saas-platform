import { Package } from 'lucide-react';
import { cookies } from 'next/headers';
import BrowseProductsGrid from './BrowseProductsGrid';

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
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Package className="h-7 w-7 text-indigo-400" />
          Browse Insurance Products
        </h1>
        <p className="text-zinc-400 mt-1 text-sm">
          The full catalog from all of our insurance partners. Apply directly from any card.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 border-dashed rounded-2xl p-12 text-center">
          <Package className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500">No products available right now. Please check back later.</p>
        </div>
      ) : (
        <BrowseProductsGrid groupedProducts={grouped} typeOrder={sortedTypes} />
      )}
    </div>
  );
}
