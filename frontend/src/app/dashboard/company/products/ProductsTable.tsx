'use client';

import React, { useState } from 'react';
import { Edit2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatDate';
import EditProductForm from './EditProductForm';
import DeleteProductButton from './DeleteProductButton';
import { useRouter } from 'next/navigation';
import { useT } from '@/i18n/LocaleProvider';

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
  const { t } = useT();
  const router = useRouter();
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const handleSaved = () => {
    setEditingProductId(null);
    router.refresh();
  };

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('tail.activeProducts')}</h2>
      </div>
      <div className="p-0 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-[#060b1a] text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider">
            <tr>
              <th className="px-6 py-3">{t('tail.productName')}</th>
              <th className="px-6 py-3">{t('finale.typeCol')}</th>
              <th className="px-6 py-3">{t('tail.basePremium')}</th>
              <th className="px-6 py-3">{t('finale.descriptionCol')}</th>
              <th className="px-6 py-3 text-right">{t('tail.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {products.map((product) => {
              const isEditing = editingProductId === product.id;

              return (
                <React.Fragment key={product.id}>
                  <tr className={`hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-colors group ${isEditing ? 'bg-slate-50 dark:bg-[#060b1a]/40' : ''}`}>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-700 transition-colors">
                        {product.name}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 uppercase">
                        {product.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(product.basePremium)}
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">/mo</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 italic">
                        {product.description || '—'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingProductId(isEditing ? null : product.id)}
                          className={`p-2 rounded-lg border transition-all ${
                            isEditing
                              ? 'bg-blue-600 border-blue-700 text-white'
                              : 'bg-slate-100 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          title={t('finale.editProductAttr')}
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
                      <td colSpan={5} className="px-6 py-4 bg-slate-50 dark:bg-[#060b1a]/80 border-t border-b border-slate-200 dark:border-slate-800/80">
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
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 italic">{t('tail.noProductsYet')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
