"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import FilterPills from '@/components/ui/FilterPills';
import { useT } from '@/i18n/LocaleProvider';

interface PolicyFiltersProps {
  counts: { [key: string]: number };
}

export default function PolicyFilters({ counts }: PolicyFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useT();
  const currentStatus = searchParams.get('status') || 'all';

  const options = [
    { value: 'all', label: t('filters.all'), count: counts['all'] },
    { value: 'ACTIVE', label: t('filters.policyActive'), count: counts['ACTIVE'] || 0 },
    { value: 'PENDING_PAYMENT', label: t('filters.policyAwaitingPayment'), count: counts['PENDING_PAYMENT'] || 0 },
    { value: 'EXPIRED', label: t('filters.policyExpired'), count: counts['EXPIRED'] || 0 },
    { value: 'CANCELLED', label: t('filters.policyCancelled'), count: counts['CANCELLED'] || 0 },
  ];

  const handleChange = (val: string) => {
    if (val === 'all') {
      router.push('/dashboard/client/policies');
    } else {
      router.push(`/dashboard/client/policies?status=${val}`);
    }
  };

  return <FilterPills options={options} value={currentStatus} onChange={handleChange} />;
}
