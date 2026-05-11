import { cookies } from 'next/headers';
import { ShieldAlert, Users } from 'lucide-react';
import CreateUserForm from './CreateUserForm';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getCompaniesData() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    
    if (!token) return { companies: [], forbidden: true };

    const response = await fetch(`${API_URL}/companies`, {
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status === 403) {
      return { companies: [], forbidden: true };
    }

    if (!response.ok) {
      return { companies: [], forbidden: false };
    }

    const companies = await response.json();
    return { companies, forbidden: false };
  } catch (error) {
    return { companies: [], forbidden: false };
  }
}

export default async function ManageUsersPage() {
  const { companies, forbidden } = await getCompaniesData();

  if (forbidden) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 border-2 border-dashed border-rose-900/30 rounded-3xl bg-rose-950/10">
        <div className="h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
          <ShieldAlert className="h-10 w-10 text-rose-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Access Forbidden</h2>
        <p className="text-zinc-400 text-center max-w-md">
          You do not have permission to access this page. Staff account management is restricted to Platform Administrators only.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <Users className="h-6 w-6 text-indigo-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Manage Users</h1>
          <p className="text-zinc-400 mt-1">
            Create staff accounts (Agents, Company Admins, Platform Admins).
          </p>
        </div>
      </div>

      <div className="max-w-4xl">
        <CreateUserForm companies={companies} />
      </div>
    </div>
  );
}
