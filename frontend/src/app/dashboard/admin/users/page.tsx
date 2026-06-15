import { cookies } from 'next/headers';
import { ShieldAlert, Users } from 'lucide-react';
import Link from 'next/link';
import CreateUserForm from './CreateUserForm';
import UsersFilters from './UsersFilters';
import EmptyState from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/formatDate';
import { getT } from '@/i18n/getT';
import { translateStatus, translateRiskLevel, translateRole } from '@/i18n/translateStatus';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const roleColors: Record<string, string> = {
  CUSTOMER: 'bg-blue-700/10 text-blue-700 border-blue-700/20',
  AGENT: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  COMPANY_ADMIN: 'bg-blue-700/10 text-blue-700 border-blue-700/20',
  PLATFORM_ADMIN: 'bg-blue-700/10 text-blue-700 border-blue-700/20',
};

async function getPageData(roleFilter?: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return { users: [], companies: [], forbidden: true, counts: {} };

    const authHeader: HeadersInit = { Authorization: `Bearer ${token}` };

    const usersUrl = roleFilter && roleFilter !== 'all'
      ? `${API_URL}/admin/users?limit=200&role=${roleFilter}`
      : `${API_URL}/admin/users?limit=200`;

    const [usersRes, allUsersRes, companiesRes] = await Promise.all([
      fetch(usersUrl, { cache: 'no-store', headers: authHeader }).catch(() => null),
      // Fetch all users (unfiltered) for counts
      roleFilter && roleFilter !== 'all'
        ? fetch(`${API_URL}/admin/users?limit=200`, { cache: 'no-store', headers: authHeader }).catch(() => null)
        : null,
      fetch(`${API_URL}/companies`, { cache: 'no-store', headers: authHeader }).catch(() => null),
    ]);

    if (usersRes?.status === 403) return { users: [], companies: [], forbidden: true, counts: {} };

    const usersJson = usersRes && usersRes.ok ? await usersRes.json() : { items: [] };
    const allUsersJson = allUsersRes && allUsersRes.ok ? await allUsersRes.json() : null;
    const companiesJson = companiesRes && companiesRes.ok ? await companiesRes.json() : { items: [] };

    const users = usersJson.items ?? [];
    const companies = companiesJson.items ?? [];

    // Compute counts from the full user list
    const allUsers = allUsersJson ? (allUsersJson.items ?? []) : users;
    const counts: Record<string, number> = { all: 0 };
    for (const u of allUsers) {
      counts['all']++;
      counts[u.role] = (counts[u.role] || 0) + 1;
    }

    return { users, companies, forbidden: false, counts };
  } catch {
    return { users: [], companies: [], forbidden: false, counts: {} };
  }
}

type Props = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> };

export default async function ManageUsersPage(props: Props) {
  const { t } = await getT();
  const searchParams = await props.searchParams;
  const roleFilter = typeof searchParams.role === 'string' ? searchParams.role : undefined;

  const { users, companies, forbidden, counts } = await getPageData(roleFilter);

  if (forbidden) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 border-2 border-dashed border-rose-900/30 rounded-3xl bg-rose-950/10">
        <div className="h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
          <ShieldAlert className="h-10 w-10 text-rose-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">{t('tail.accessForbidden')}</h2>
        <p className="text-slate-600 dark:text-slate-400 text-center max-w-md">
          {t('finale.accessForbiddenStaff')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-blue-700/10 border border-blue-700/20 flex items-center justify-center">
          <Users className="h-6 w-6 text-blue-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{t('tail.userManagement')}</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">{t('tail.userManagementDesc')}</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="space-y-4">
        <UsersFilters counts={counts} />

        {users.length > 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[800px]">
                <thead className="bg-slate-50 dark:bg-[#060b1a] text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-3">{t('finale.nameCol')}</th>
                    <th className="px-6 py-3">{t('finale.emailCol')}</th>
                    <th className="px-6 py-3">{t('finale.roleCol')}</th>
                    <th className="px-6 py-3">{t('tail.company')}</th>
                    <th className="px-6 py-3 text-right">{t('tail.joined')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {users.map((user: any) => (
                    <tr key={user.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-4">
                        <Link href={`/dashboard/admin/users/${user.id}`} className="flex items-center gap-3 group-hover:text-blue-700 transition-colors">
                          <div className="h-8 w-8 rounded-full bg-blue-700/10 border border-blue-700/20 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">
                            {(user.firstName?.[0] || '').toUpperCase()}{(user.lastName?.[0] || '').toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-700 transition-colors">
                            {user.firstName} {user.lastName}
                          </span>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono text-xs">
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${roleColors[user.role] || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'}`}>
                          {translateRole(t, user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-xs">
                        {user.company?.name || '—'}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-500 dark:text-slate-400 font-mono text-xs">
                        {formatDate(user.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title={t('finale.noUsersAttr')}
            description="No users match the current filter."
          />
        )}
      </div>

      {/* Create User Form */}
      <div className="max-w-4xl">
        <CreateUserForm companies={companies} />
      </div>
    </div>
  );
}
