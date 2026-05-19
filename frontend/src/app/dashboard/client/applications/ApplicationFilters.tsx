"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import FilterPills from '@/components/ui/FilterPills';
import { useT } from '@/i18n/LocaleProvider';

interface ApplicationFiltersProps {
  counts: { [key: string]: number };
}

export default function ApplicationFilters({ counts }: ApplicationFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useT();
  const currentStatus = searchParams.get('status') || 'all';

  const options = [
    { value: 'all', label: t('filters.all'), count: counts['all'] },
    { value: 'PENDING', label: t('filters.appPending'), count: counts['PENDING'] || 0 },
    { value: 'APPROVED', label: t('filters.appApproved'), count: counts['APPROVED'] || 0 },
    { value: 'REJECTED', label: t('filters.appRejected'), count: counts['REJECTED'] || 0 },
    { value: 'UNDER_REVIEW', label: t('filters.appUnderReview'), count: counts['UNDER_REVIEW'] || 0 },
  ];

  const handleChange = (val: string) => {
    if (val === 'all') {
      router.push('/dashboard/client/applications');
    } else {
      router.push(`/dashboard/client/applications?status=${val}`);
    }
  };

  return <FilterPills options={options} value={currentStatus} onChange={handleChange} />;
}
