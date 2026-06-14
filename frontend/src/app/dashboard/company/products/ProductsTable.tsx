'use client';

import React, { useState } from 'react';
import { Edit2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatDate';
import EditProductForm from './EditProductForm';
import DeleteProductButton from './DeleteProductButton';
import { useRouter } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  type: string;
  basePremium: number;
  description: string | null;
}

interface ProductsTableProps {
  products: Product[];
}

export default function ProductsTable({ products }: ProductsTableProps) {
  const router = useRouter();
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const handleSaved = () => {
    setEditingProductId(null);
    router.refresh();
  };

  return (
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
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {products.map((product) => {
              const isEditing = editingProductId === product.id;

              return (
                <React.Fragment key={product.id}>
                  <tr className={`hover:bg-zinc-800/30 transition-colors group ${isEditing ? 'bg-zinc-950/40' : ''}`}>
                    <td className="px-6 py-4">
                      <p className="font-bold text-white group-hover:text-teal-400 transition-colors">
                        {product.name}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 border border-zinc-700 text-zinc-400 uppercase">
                        {product.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-white">
                      {formatCurrency(product.basePremium)}
                      <span className="text-[10px] text-zinc-500 font-normal">/mo</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-zinc-500 line-clamp-1 italic">
                        {product.description || '—'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingProductId(isEditing ? null : product.id)}
                          className={`p-2 rounded-lg border transition-all ${
                            isEditing
                              ? 'bg-teal-600 border-teal-500 text-white'
                              : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800'
                          }`}
                          title="Edit Product"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>

                        <DeleteProductButton
                          productId={product.id}
                          productName={product.name}
                          onDeleted={() => router.refresh()}
                        />
                      </div>
                    </td>
                  </tr>

                  {isEditing && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 bg-zinc-950/80 border-t border-b border-zinc-800/80">
                        <EditProductForm
                          product={product}
                          onSaved={handleSaved}
                          onCancel={() => setEditingProductId(null)}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}

            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 italic">
                  No products yet — create your first one below.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
