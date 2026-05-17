'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import FilterPills from '@/components/ui/FilterPills';

const ROLE_OPTIONS = [
  { value: 'all', label: 'All Roles' },
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'AGENT', label: 'Agent' },
  { value: 'COMPANY_ADMIN', label: 'Company Admin' },
  { value: 'PLATFORM_ADMIN', label: 'Platform Admin' },
];

export default function UsersFilters({ counts }: { counts: Record<string, number> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentRole = searchParams.get('role') || 'all';

  const options = ROLE_OPTIONS.map((o) => ({
    ...o,
    count: counts[o.value] ?? 0,
  }));

  return (
    <FilterPills
      options={options}
      value={currentRole}
      onChange={(val) => {
        if (val === 'all') {
          router.push('/dashboard/admin/users');
        } else {
          router.push(`/dashboard/admin/users?role=${val}`);
        }
      }}
    />
  );
}
