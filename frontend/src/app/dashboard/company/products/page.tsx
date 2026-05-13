import { cookies } from 'next/headers';
import { Package, ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import CreateProductForm from './CreateProductForm';
import { formatCurrency } from '@/lib/formatDate';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getMyProducts() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    
    if (!token) return { products: [], status: 401 };

    const response = await fetch(`${API_URL}/products/my-company`, {
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { products: [], status: response.status };
    }

    const productsJson = await response.json();
    const products = productsJson.items ?? [];
    return { products, status: 200 };
  } catch (error) {
    return { products: [], status: 500 };
  }
}

export default async function CompanyProductsPage() {
  const { products, status } = await getMyProducts();

  if (status === 401 || status === 403) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 border-2 border-dashed border-rose-900/30 rounded-3xl bg-rose-950/10">
        <div className="h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
          <ShieldAlert className="h-10 w-10 text-rose-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Access Forbidden</h2>
        <p className="text-zinc-400 text-center max-w-md">
          You do not have permission to access this page. Product management is restricted to Company Administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Package className="h-6 w-6 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Product Catalog</h1>
            <p className="text-zinc-400 mt-1">Manage insurance products for your company.</p>
          </div>
        </div>
        <Link 
          href="/dashboard/company"
          className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Product List Table */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
              <h2 className="text-lg font-bold text-white">Active Products</h2>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-950 text-zinc-500 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Product Name</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Base Premium</th>
                    <th className="px-6 py-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {products.map((product: any) => (
                    <tr key={product.id} className="hover:bg-zinc-800/30 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-bold text-white group-hover:text-indigo-400 transition-colors">{product.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 border border-zinc-700 text-zinc-400 uppercase">
                          {product.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-white">
                        {formatCurrency(product.basePremium)}<span className="text-[10px] text-zinc-500 font-normal">/mo</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-zinc-500 line-clamp-1 italic">{product.description || '—'}</p>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 italic">
                        No products yet — create your first one below.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="lg:col-span-1">
          <CreateProductForm />
        </div>
      </div>
    </div>
  );
}
