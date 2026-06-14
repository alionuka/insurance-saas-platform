import { cookies } from 'next/headers';
import ApplicationsTable from './ApplicationsTable';
import EmptyState from '@/components/ui/EmptyState';
import { FileText } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getApplications() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value ?? '';
    const authHeader: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    const res = await fetch(`${API_URL}/applications`, { 
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

export default async function AgentApplicationsPage() {
  const applications = await getApplications();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Applications Queue</h1>
        <p className="text-slate-600 mt-1 text-sm">Review and update application statuses.</p>
      </div>

      {applications.length > 0 ? (
        <ApplicationsTable initialApplications={applications} />
      ) : (
        <EmptyState 
          icon={FileText} 
          title="No applications" 
          description="There are no applications waiting for review." 
        />
      )}
    </div>
  );
}
