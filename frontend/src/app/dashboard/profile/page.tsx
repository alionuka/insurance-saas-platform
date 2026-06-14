import { cookies } from 'next/headers';
import { UserCircle, Shield, Activity, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/formatDate';
import ChangePasswordForm from './ChangePasswordForm';
import EditProfileForm from './EditProfileForm';
import RestartTourButton from '@/components/onboarding/RestartTourButton';
import GdprPanel from './GdprPanel';
import { getT } from '@/i18n/getT';
import AvatarUploadButton from './AvatarUploadButton';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getProfileData() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) return { error: 'UNAUTHORIZED' };

  try {
    const [meRes, auditRes] = await Promise.all([
      fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),
      fetch(`${API_URL}/audit-logs/me?limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),
    ]);

    const meData = meRes.ok ? await meRes.json() : null;
    const auditData = auditRes.ok ? await auditRes.json() : { items: [] };

    return { user: meData, auditLogs: auditData.items, error: null };
  } catch {
    return { error: 'FAILED_TO_FETCH' };
  }
}

export default async function ProfilePage() {
  const { user, auditLogs, error } = await getProfileData();
  const { t } = await getT();

  if (error === 'UNAUTHORIZED') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">{t('profile.accessDenied')}</h2>
        <p className="text-zinc-400">{t('profile.accessDeniedHint')}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">{t('profile.errorLoading')}</h2>
        <p className="text-zinc-400">{t('profile.errorLoadingHint')}</p>
      </div>
    );
  }

  const getInitials = () => {
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'CUSTOMER': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'AGENT': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'COMPANY_ADMIN': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'PLATFORM_ADMIN': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('LOGIN') || action.includes('REGISTER') || action.includes('PASSWORD')) {
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
    if (action.includes('APPLICATION') || action.includes('CLAIM')) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
    if (action.includes('PAYMENT')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
    return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
  };

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row md:items-center gap-6 bg-zinc-900 border border-zinc-800 p-8 rounded-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-amber-500" />
        <div className="flex flex-col items-center gap-3 shrink-0">
          <div className="h-24 w-24 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center overflow-hidden">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={`${user.firstName} ${user.lastName}`}
                className="h-full w-full object-cover rounded-full"
              />
            ) : (
              <span className="text-3xl font-bold text-amber-400">{getInitials()}</span>
            )}
          </div>
          <AvatarUploadButton />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white tracking-tight">{user.firstName} {user.lastName}</h1>
          <p className="text-zinc-400 mt-1">{user.email}</p>
          <div className="mt-3">
            <span className={`text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider border ${getRoleBadgeColor(user.role)}`}>
              {user.role.replace('_', ' ')}
            </span>
          </div>
        </div>
        <div className="shrink-0 md:self-start md:pt-1">
          <RestartTourButton />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
          {/* Account Info */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-amber-400" />
              {t('profile.accountInformation')}
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-zinc-800/60">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">{t('profile.emailAddress')}</p>
                <p className="text-white font-medium break-all">{user.email}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">{t('profile.role')}</p>
                <p className="text-white font-medium">{user.role}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">{t('profile.memberSince')}</p>
                <p className="text-white font-medium">{formatDate(user.createdAt)}</p>
              </div>
              {user.role === 'COMPANY_ADMIN' && user.company && (
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">{t('profile.companyAffiliation')}</p>
                  <p className="text-white font-medium">{user.company.name}</p>
                </div>
              )}
            </div>

            {user.role === 'CUSTOMER' && (
              <div className="grid grid-cols-3 gap-3 mb-6 pb-6 border-b border-zinc-800/60">
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                  <p className="text-[10px] text-amber-400 uppercase font-bold tracking-wider mb-1">Age</p>
                  <p className="text-white font-semibold text-lg">{user.age ?? '—'}</p>
                  <p className="text-[9px] text-zinc-500 mt-1">used by Risk ML</p>
                </div>
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                  <p className="text-[10px] text-amber-400 uppercase font-bold tracking-wider mb-1">Credit Score</p>
                  <p className="text-white font-semibold text-lg">{user.creditScore ?? '—'}</p>
                  <p className="text-[9px] text-zinc-500 mt-1">used by Risk ML</p>
                </div>
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                  <p className="text-[10px] text-amber-400 uppercase font-bold tracking-wider mb-1">Annual Income</p>
                  <p className="text-white font-semibold text-lg">{user.annualIncome != null ? `$${Number(user.annualIncome).toLocaleString()}` : '—'}</p>
                  <p className="text-[9px] text-zinc-500 mt-1">used by Risk + Recs</p>
                </div>
              </div>
            )}

            <EditProfileForm initialValues={{...user}} isCustomer={user.role === 'CUSTOMER'} />
          </div>

          {/* Security */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-400" />
              {t('profile.security')}
            </h2>
            <p className="text-xs text-zinc-500 mb-6">{t('profile.securityHint')}</p>

            <ChangePasswordForm />
          </div>

          {/* GDPR — Data Rights */}
          <GdprPanel />
        </div>

        {/* Recent Activity */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col h-full">
          <div className="p-6 border-b border-zinc-800">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-amber-400" />
              {t('profile.recentActivity')}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {auditLogs && auditLogs.length > 0 ? (
              <div className="divide-y divide-zinc-800/50">
                {auditLogs.map((log: { id: string; action: string; resourceType?: string; resourceId?: string; createdAt: string }) => (
                  <div key={log.id} className="p-5 hover:bg-zinc-800/20 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border ${getActionColor(log.action)}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-zinc-500">{formatDate(log.createdAt)}</span>
                    </div>
                    {log.resourceType && (
                      <p className="text-sm text-zinc-400 font-medium">
                        {log.resourceType} <span className="text-zinc-600 font-normal">#{log.resourceId?.substring(0, 8)}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="text-zinc-500">{t('profile.noActivity')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
