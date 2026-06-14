'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, User } from 'lucide-react';
import { toast } from 'sonner';

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
  
  const [firstName, setFirstName] = useState(initialValues.firstName || '');
  const [lastName, setLastName] = useState(initialValues.lastName || '');
  const [age, setAge] = useState<string>(initialValues.age !== undefined && initialValues.age !== null ? String(initialValues.age) : '');
  const [annualIncome, setAnnualIncome] = useState<string>(initialValues.annualIncome !== undefined && initialValues.annualIncome !== null ? String(initialValues.annualIncome) : '');
  const [creditScore, setCreditScore] = useState<string>(initialValues.creditScore !== undefined && initialValues.creditScore !== null ? String(initialValues.creditScore) : '');

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim()) {
      toast.error('First name is required');
      return;
    }
    if (!lastName.trim()) {
      toast.error('Last name is required');
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
          toast.error('Age must be an integer between 18 and 100');
          return;
        }
        payload.age = parsedAge;
      } else {
        payload.age = null;
      }

      if (annualIncome !== '') {
        const parsedIncome = parseFloat(annualIncome);
        if (isNaN(parsedIncome) || parsedIncome < 0) {
          toast.error('Annual income must be a number greater than or equal to 0');
          return;
        }
        payload.annualIncome = parsedIncome;
      } else {
        payload.annualIncome = null;
      }

      if (creditScore !== '') {
        const parsedScore = parseInt(creditScore, 10);
        if (isNaN(parsedScore) || parsedScore < 300 || parsedScore > 850) {
          toast.error('Credit score must be an integer between 300 and 850');
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
      toast.success('Profile updated successfully');
      router.refresh();
    } catch (err: any) {
      const message = err.response?.data?.message || 'An unexpected error occurred. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">First Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
            <input
              type="text"
              name="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Last Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
            <input
              type="text"
              name="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              required
            />
          </div>
        </div>

        {isCustomer && (
          <>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 30"
                min="18"
                max="100"
                className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Credit Score</label>
              <input
                type="number"
                value={creditScore}
                onChange={(e) => setCreditScore(e.target.value)}
                placeholder="e.g. 700"
                min="300"
                max="850"
                className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-zinc-300 mb-1">Annual Income ($)</label>
              <input
                type="number"
                value={annualIncome}
                onChange={(e) => setAnnualIncome(e.target.value)}
                placeholder="e.g. 75000"
                min="0"
                step="any"
                className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>
          </>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4"
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        Save Profile Changes
      </button>
    </form>
  );
}
