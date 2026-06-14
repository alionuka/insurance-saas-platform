import { cookies } from 'next/headers';
import { Package, ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import CreateProductForm from './CreateProductForm';
import ProductsTable from './ProductsTable';
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
          <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Package className="h-6 w-6 text-blue-500" />
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
          <ProductsTable products={products} />
        </div>

        <div className="lg:col-span-1">
          <CreateProductForm />
        </div>
      </div>
    </div>
  );
}
