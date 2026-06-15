'use client';

import React, { useState } from 'react';
import { Package, Plus, Loader2, DollarSign, Type, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { logout } from '@/lib/auth';
import { useT } from '@/i18n/LocaleProvider';

export default function CreateProductForm() {
  const router = useRouter();
  const { t } = useT();
  const [formData, setFormData] = useState({
    name: '',
    type: 'LIFE',
    description: '',
    basePremium: '',
  });
  const [loading, setLoading] = useState(false);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);


    if (!formData.name) {
      toast.error(t('productForm.nameRequired'));
      setLoading(false);
      return;
    }

    if (parseFloat(formData.basePremium) < 0) {
      toast.error(t('productForm.premiumNonneg'));
      setLoading(false);
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      logout();
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          basePremium: parseFloat(formData.basePremium) || 0,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          return;
        }
        throw new Error(data.message || t('productForm.createFailed'));
      }

      toast.success(t('productForm.createdSuccess').replace('{name}', data.name).replace('{type}', data.type));
      setFormData({
        name: '',
        type: 'LIFE',
        description: '',
        basePremium: '',
      });
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || t('productForm.submitError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center gap-2">
        <Plus className="h-5 w-5 text-blue-700" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('productForm.createTitle')}</h2>
      </div>

      <div className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">


          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                {t('productForm.productName')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Package className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-[#060b1a] text-slate-900 dark:text-slate-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder={t('productForm.productNamePlaceholder')}
                />
              </div>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                {t('productForm.productType')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Type className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                </div>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-[#060b1a] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm appearance-none cursor-pointer"
                >
                  <option value="LIFE">{t('productTypes.LIFE')}</option>
                  <option value="AUTO">{t('productTypes.AUTO')}</option>
                  <option value="HEALTH">{t('productTypes.HEALTH')}</option>
                  <option value="PROPERTY">{t('productTypes.PROPERTY')}</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="basePremium" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              {t('productForm.basePremiumLabel')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              </div>
              <input
                id="basePremium"
                name="basePremium"
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.basePremium}
                onChange={handleChange}
                className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-[#060b1a] text-slate-900 dark:text-slate-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              {t('productForm.descriptionOptional')}
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 flex items-center pointer-events-none">
                <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              </div>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-[#060b1a] text-slate-900 dark:text-slate-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm resize-none"
                placeholder={t('productForm.descriptionPlaceholder')}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-blue-900/20"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                t('productForm.registerBtn')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
