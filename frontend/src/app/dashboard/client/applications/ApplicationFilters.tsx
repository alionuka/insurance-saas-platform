"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import FilterPills from '@/components/ui/FilterPills';

interface ApplicationFiltersProps {
  counts: { [key: string]: number };
}

export default function ApplicationFilters({ counts }: ApplicationFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get('status') || 'all';

  const options = [
    { value: 'all', label: 'All', count: counts['all'] },
    { value: 'PENDING', label: 'Pending', count: counts['PENDING'] || 0 },
    { value: 'APPROVED', label: 'Approved', count: counts['APPROVED'] || 0 },
    { value: 'REJECTED', label: 'Rejected', count: counts['REJECTED'] || 0 },
    { value: 'UNDER_REVIEW', label: 'Under Review', count: counts['UNDER_REVIEW'] || 0 },
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
