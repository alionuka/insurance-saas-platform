"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import FilterPills from '@/components/ui/FilterPills';

interface ClaimFiltersProps {
  counts: { [key: string]: number };
}

export default function ClaimFilters({ counts }: ClaimFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get('status') || 'all';

  const options = [
    { value: 'all', label: 'All', count: counts['all'] },
    { value: 'FILED', label: 'Filed', count: counts['FILED'] || 0 },
    { value: 'IN_PROGRESS', label: 'In Progress', count: counts['IN_PROGRESS'] || 0 },
    { value: 'APPROVED', label: 'Approved', count: counts['APPROVED'] || 0 },
    { value: 'DENIED', label: 'Denied', count: counts['DENIED'] || 0 },
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
