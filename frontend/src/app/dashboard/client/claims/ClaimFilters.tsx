"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import FilterPills from '@/components/ui/FilterPills';
import { useT } from '@/i18n/LocaleProvider';

interface ClaimFiltersProps {
  counts: { [key: string]: number };
}

export default function ClaimFilters({ counts }: ClaimFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useT();
  const currentStatus = searchParams.get('status') || 'all';

  const options = [
    { value: 'all', label: t('filters.all'), count: counts['all'] },
    { value: 'FILED', label: t('filters.claimFiled'), count: counts['FILED'] || 0 },
    { value: 'IN_PROGRESS', label: t('filters.claimInProgress'), count: counts['IN_PROGRESS'] || 0 },
    { value: 'APPROVED', label: t('filters.claimApproved'), count: counts['APPROVED'] || 0 },
    { value: 'DENIED', label: t('filters.claimDenied'), count: counts['DENIED'] || 0 },
  ];

  const handleChange = (val: string) => {
    if (val === 'all') {
      router.push('/dashboard/client/claims');
    } else {
      router.push(`/dashboard/client/claims?status=${val}`);
    }
  };

  return <FilterPills options={options} value={currentStatus} onChange={handleChange} />;
}
