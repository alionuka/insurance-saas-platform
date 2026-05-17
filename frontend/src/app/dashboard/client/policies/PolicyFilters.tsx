"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import FilterPills from '@/components/ui/FilterPills';

interface PolicyFiltersProps {
  counts: { [key: string]: number };
}

export default function PolicyFilters({ counts }: PolicyFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get('status') || 'all';

  const options = [
    { value: 'all', label: 'All', count: counts['all'] },
    { value: 'ACTIVE', label: 'Active', count: counts['ACTIVE'] || 0 },
    { value: 'PENDING_PAYMENT', label: 'Awaiting Payment', count: counts['PENDING_PAYMENT'] || 0 },
    { value: 'EXPIRED', label: 'Expired', count: counts['EXPIRED'] || 0 },
    { value: 'CANCELLED', label: 'Cancelled', count: counts['CANCELLED'] || 0 },
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
