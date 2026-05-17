import { cookies } from 'next/headers';
import ClaimsTable from './ClaimsTable';
import EmptyState from '@/components/ui/EmptyState';
import { Activity } from 'lucide-react';

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
  const claims = await getClaims();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Claims Queue</h1>
        <p className="text-zinc-400 mt-1 text-sm">Investigate and update claim statuses.</p>
      </div>

      {claims.length > 0 ? (
        <ClaimsTable initialClaims={claims} />
      ) : (
        <EmptyState 
          icon={Activity} 
          title="No claims" 
          description="There are no claims waiting for investigation." 
        />
      )}
    </div>
  );
}
