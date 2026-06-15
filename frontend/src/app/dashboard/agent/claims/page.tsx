import { cookies } from 'next/headers';
import ClaimsTable from './ClaimsTable';
import EmptyState from '@/components/ui/EmptyState';
import { Activity } from 'lucide-react';
import { getT } from '@/i18n/getT';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getClaims() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value ?? '';
    const authHeader: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    const res = await fetch(`${API_URL}/claims`, { 
      cache: 'no-store',
      headers: authHeader,
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items ?? [];
  } catch {
    return [];
  }
}

export default async function AgentClaimsPage() {
  const { t } = await getT();
  const claims = await getClaims();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{t('tail.claimsQueue')}</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">{t('tail.claimsQueueDesc')}</p>
      </div>

      {claims.length > 0 ? (
        <ClaimsTable initialClaims={claims} />
      ) : (
        <EmptyState 
          icon={Activity} 
          title={t('finale.notClaimsAttr')} 
          description="There are no claims waiting for investigation." 
        />
      )}
    </div>
  );
}
