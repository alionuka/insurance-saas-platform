'use client';

import React, { useState } from 'react';
import { Package, Loader2, DollarSign, Type, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { logout } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface EditProductFormProps {
  product: {
    id: string;
    name: string;
    description?: string | null;
    type: string;
    basePremium: number;
  };
  onSaved: () => void;
  onCancel: () => void;
}

export default function EditProductForm({ product, onSaved, onCancel }: EditProductFormProps) {
  const [formData, setFormData] = useState({
    name: product.name,
    type: product.type,
    description: product.description || '',
    basePremium: String(product.basePremium),
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    const premium = parseFloat(formData.basePremium);
    if (isNaN(premium) || premium < 0) {
      toast.error('Base premium must be at least 0');
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      logout();
      return;
    }

    const payload: any = {};
    if (formData.name.trim() !== product.name) {
      payload.name = formData.name.trim();
    }
    if (formData.type !== product.type) {
      payload.type = formData.type;
    }
    if (formData.description.trim() !== (product.description || '')) {
      payload.description = formData.description.trim();
    }
    if (premium !== product.basePremium) {
      payload.basePremium = premium;
    }

    if (Object.keys(payload).length === 0) {
      onSaved();
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/products/${product.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          return;
        }
        throw new Error(data.message || 'Failed to update product');
      }

      toast.success(`Product ${data.name} updated successfully`);
      onSaved();
    } catch (err: any) {
      toast.error(err.message || 'An error occurred during submission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-slate-50 dark:bg-[#060b1a] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            Product Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Package className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            </div>
            <input
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="appearance-none block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            Product Type
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Type className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            </div>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm cursor-pointer appearance-none"
            >
              <option value="LIFE">Life Insurance</option>
              <option value="AUTO">Auto Insurance</option>
              <option value="HEALTH">Health Insurance</option>
              <option value="PROPERTY">Property Insurance</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            Base Monthly Premium ($)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            </div>
            <input
              name="basePremium"
              type="number"
              step="0.01"
              min="0"
              required
              value={formData.basePremium}
              onChange={handleChange}
              className="appearance-none block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            Description
          </label>
          <div className="relative">
            <div className="absolute top-2.5 left-3 flex items-center pointer-events-none">
              <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            </div>
            <textarea
              name="description"
              rows={2}
              value={formData.description}
              onChange={handleChange}
              className="appearance-none block w-full pl-10 pr-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm resize-none"
              placeholder="Brief description..."
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/60">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 border border-transparent rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50"
        >
          {loading && <Loader2 className="h-3 w-3 animate-spin" />}
          Save Changes
        </button>
      </div>
    </form>
  );
}
