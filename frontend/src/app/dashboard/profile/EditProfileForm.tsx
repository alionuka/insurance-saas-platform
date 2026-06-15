'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/i18n/LocaleProvider';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

import apiClient from '@/lib/api-client';

interface EditProfileFormProps {
  initialValues: {
    firstName: string;
    lastName: string;
    age?: number | null;
    annualIncome?: number | null;
    creditScore?: number | null;
  };
  isCustomer: boolean;
}

export default function EditProfileForm({ initialValues, isCustomer }: EditProfileFormProps) {
  const router = useRouter();
  const { t } = useT();

  const [firstName, setFirstName] = useState(initialValues.firstName || '');
  const [lastName, setLastName] = useState(initialValues.lastName || '');
  const [age, setAge] = useState<string>(initialValues.age !== undefined && initialValues.age !== null ? String(initialValues.age) : '');
  const [annualIncome, setAnnualIncome] = useState<string>(initialValues.annualIncome !== undefined && initialValues.annualIncome !== null ? String(initialValues.annualIncome) : '');
  const [creditScore, setCreditScore] = useState<string>(initialValues.creditScore !== undefined && initialValues.creditScore !== null ? String(initialValues.creditScore) : '');

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim()) {
      toast.error(t('profileForm.firstNameReq'));
      return;
    }
    if (!lastName.trim()) {
      toast.error(t('profileForm.lastNameReq'));
      return;
    }

    const payload: any = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    };

    if (isCustomer) {
      if (age !== '') {
        const parsedAge = parseInt(age, 10);
        if (isNaN(parsedAge) || parsedAge < 18 || parsedAge > 100) {
          toast.error(t('profileForm.ageRange'));
          return;
        }
        payload.age = parsedAge;
      } else {
        payload.age = null;
      }

      if (annualIncome !== '') {
        const parsedIncome = parseFloat(annualIncome);
        if (isNaN(parsedIncome) || parsedIncome < 0) {
          toast.error(t('profileForm.incomeRange'));
          return;
        }
        payload.annualIncome = parsedIncome;
      } else {
        payload.annualIncome = null;
      }

      if (creditScore !== '') {
        const parsedScore = parseInt(creditScore, 10);
        if (isNaN(parsedScore) || parsedScore < 300 || parsedScore > 850) {
          toast.error(t('profileForm.creditScoreRange'));
          return;
        }
        payload.creditScore = parsedScore;
      } else {
        payload.creditScore = null;
      }
    }

    setIsLoading(true);

    try {
      await apiClient.patch('/auth/me', payload);
      toast.success(t('profileForm.updateSuccess'));
      router.refresh();
    } catch (err: any) {
      const message = err.response?.data?.message || t('profileForm.updateError');
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('userForm.firstName')}</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 dark:text-slate-400" />
            <input
              type="text"
              name="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#060b1a] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('userForm.lastName')}</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 dark:text-slate-400" />
            <input
              type="text"
              name="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#060b1a] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>
        </div>

        {isCustomer && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('dashboard.age')}</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder={t('profileForm.agePh')}
                min="18"
                max="100"
                className="w-full px-4 py-2 bg-slate-50 dark:bg-[#060b1a] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('dashboard.creditScore')}</label>
              <input
                type="number"
                value={creditScore}
                onChange={(e) => setCreditScore(e.target.value)}
                placeholder={t('profileForm.creditScorePh')}
                min="300"
                max="850"
                className="w-full px-4 py-2 bg-slate-50 dark:bg-[#060b1a] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('profileForm.annualIncomeLabel')}</label>
              <input
                type="number"
                value={annualIncome}
                onChange={(e) => setAnnualIncome(e.target.value)}
                placeholder={t('profileForm.incomePh')}
                min="0"
                step="any"
                className="w-full px-4 py-2 bg-slate-50 dark:bg-[#060b1a] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-700 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4"
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {t('profileForm.saveBtn')}
      </button>
    </form>
  );
}
