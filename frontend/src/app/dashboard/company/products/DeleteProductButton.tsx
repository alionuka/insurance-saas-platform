'use client';

import React, { useState } from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { logout } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface DeleteProductButtonProps {
  productId: string;
  productName: string;
  onDeleted: () => void;
}

export default function DeleteProductButton({ productId, productName, onDeleted }: DeleteProductButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      logout();
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          return;
        }
        if (response.status === 409) {
          toast.error(data.message || 'Conflict: This product is linked to other resources');
          setIsOpen(false);
          return;
        }
        throw new Error(data.message || 'Failed to delete product');
      }

      toast.success(`Product "${productName}" deleted successfully`);
      setIsOpen(false);
      onDeleted();
    } catch (err: any) {
      toast.error(err.message || 'An error occurred during deletion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-slate-900 dark:hover:text-slate-100 transition-all shadow-sm"
        title="Delete Product"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60  z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center gap-3 text-rose-500">
              <div className="h-10 w-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Confirm Deletion</h2>
            </div>

            <div className="p-6">
              <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-900 dark:text-slate-100">"{productName}"</strong>? This action cannot be undone.
              </p>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-[#060b1a] border-t border-slate-200 dark:border-slate-800/60 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={loading}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 border border-transparent rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 bg-rose-600 hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-all disabled:opacity-50 shadow-lg shadow-rose-900/20"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Delete Product'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
