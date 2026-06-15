'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import FilterPills from '@/components/ui/FilterPills';
import { useT } from '@/i18n/LocaleProvider';
import { translateRole } from '@/i18n/translateStatus';

export default function UsersFilters({ counts }: { counts: Record<string, number> }) {
  const router = useRouter();
  const { t } = useT();
  const searchParams = useSearchParams();
  const currentRole = searchParams.get('role') || 'all';

  // Role filter pill labels flow through translateRole so they switch with
  // the active locale; "all" uses the shared filters.allRoles key.
  const options = [
    { value: 'all', label: t('filters.allRoles'), count: counts['all'] ?? 0 },
    { value: 'CUSTOMER', label: translateRole(t, 'CUSTOMER'), count: counts['CUSTOMER'] ?? 0 },
    { value: 'AGENT', label: translateRole(t, 'AGENT'), count: counts['AGENT'] ?? 0 },
    { value: 'COMPANY_ADMIN', label: translateRole(t, 'COMPANY_ADMIN'), count: counts['COMPANY_ADMIN'] ?? 0 },
    { value: 'PLATFORM_ADMIN', label: translateRole(t, 'PLATFORM_ADMIN'), count: counts['PLATFORM_ADMIN'] ?? 0 },
  ];

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
