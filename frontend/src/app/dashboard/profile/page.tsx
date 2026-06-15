import { cookies } from 'next/headers';
import { UserCircle, Shield, Activity, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/formatDate';
import ChangePasswordForm from './ChangePasswordForm';
import EditProfileForm from './EditProfileForm';
import RestartTourButton from '@/components/onboarding/RestartTourButton';
import GdprPanel from './GdprPanel';
import { getT } from '@/i18n/getT';
import { translateAuditAction, translateResourceType } from '@/i18n/translateStatus';
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
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{t('profile.accessDenied')}</h2>
        <p className="text-slate-600 dark:text-slate-400">{t('profile.accessDeniedHint')}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{t('profile.errorLoading')}</h2>
        <p className="text-slate-600 dark:text-slate-400">{t('profile.errorLoadingHint')}</p>
      </div>
    );
  }

  const getInitials = () => {
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'CUSTOMER': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'AGENT': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'COMPANY_ADMIN': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'PLATFORM_ADMIN': return 'bg-slate-100 text-slate-900 border-slate-300';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('LOGIN') || action.includes('REGISTER') || action.includes('PASSWORD')) {
      return 'bg-blue-700/10 text-blue-700 border-blue-700/20';
    }
    if (action.includes('APPLICATION') || action.includes('CLAIM')) {
      return 'bg-blue-700/10 text-blue-700 border-blue-700/20';
    }
    if (action.includes('PAYMENT')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
    return 'bg-zinc-500/10 text-slate-600 border-zinc-500/20';
  };

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row md:items-center gap-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-blue-700" />
        <div className="flex flex-col items-center gap-3 shrink-0">
          <div className="h-24 w-24 rounded-full bg-blue-700/20 border border-blue-700/30 flex items-center justify-center overflow-hidden">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={`${user.firstName} ${user.lastName}`}
                className="h-full w-full object-cover rounded-full"
              />
            ) : (
              <span className="text-3xl font-bold text-blue-700">{getInitials()}</span>
            )}
          </div>
          <AvatarUploadButton />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{user.firstName} {user.lastName}</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">{user.email}</p>
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-blue-700" />
              {t('profile.accountInformation')}
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-800/60">
              <div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">{t('profile.emailAddress')}</p>
                <p className="text-slate-900 dark:text-slate-100 font-medium break-all">{user.email}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">{t('profile.role')}</p>
                <p className="text-slate-900 dark:text-slate-100 font-medium">{user.role}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">{t('profile.memberSince')}</p>
                <p className="text-slate-900 dark:text-slate-100 font-medium">{formatDate(user.createdAt)}</p>
              </div>
              {user.role === 'COMPANY_ADMIN' && user.company && (
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">{t('profile.companyAffiliation')}</p>
                  <p className="text-slate-900 dark:text-slate-100 font-medium">{user.company.name}</p>
                </div>
              )}
            </div>

            {user.role === 'CUSTOMER' && (
              <div className="grid grid-cols-3 gap-3 mb-6 pb-6 border-b border-slate-200 dark:border-slate-800/60">
                <div className="bg-blue-700/5 border border-blue-700/20 rounded-lg p-3">
                  <p className="text-[10px] text-blue-700 uppercase font-bold tracking-wider mb-1">{t('dashboard.age')}</p>
                  <p className="text-slate-900 dark:text-slate-100 font-semibold text-lg">{user.age ?? '—'}</p>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1">{t('tail.usedByRiskMl')}</p>
                </div>
                <div className="bg-blue-700/5 border border-blue-700/20 rounded-lg p-3">
                  <p className="text-[10px] text-blue-700 uppercase font-bold tracking-wider mb-1">{t('dashboard.creditScore')}</p>
                  <p className="text-slate-900 dark:text-slate-100 font-semibold text-lg">{user.creditScore ?? '—'}</p>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1">{t('tail.usedByRiskMl')}</p>
                </div>
                <div className="bg-blue-700/5 border border-blue-700/20 rounded-lg p-3">
                  <p className="text-[10px] text-blue-700 uppercase font-bold tracking-wider mb-1">{t('profileForm.annualIncomeLabel')}</p>
                  <p className="text-slate-900 dark:text-slate-100 font-semibold text-lg">{user.annualIncome != null ? `$${Number(user.annualIncome).toLocaleString()}` : '—'}</p>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1">{t('tail.usedByRiskRecs')}</p>
                </div>
              </div>
            )}

            <EditProfileForm initialValues={{...user}} isCustomer={user.role === 'CUSTOMER'} />
          </div>

          {/* Security */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-700" />
              {t('profile.security')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">{t('profile.securityHint')}</p>

            <ChangePasswordForm />
          </div>

          {/* GDPR — Data Rights */}
          <GdprPanel />
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col h-full">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-700" />
              {t('profile.recentActivity')}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {auditLogs && auditLogs.length > 0 ? (
              <div className="divide-y divide-zinc-800/50">
                {auditLogs.map((log: { id: string; action: string; resourceType?: string; resourceId?: string; createdAt: string }) => (
                  <div key={log.id} className="p-5 hover:bg-slate-100 dark:hover:bg-slate-800/20 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border ${getActionColor(log.action)}`}>
                        {translateAuditAction(t, log.action)}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(log.createdAt)}</span>
                    </div>
                    {log.resourceType && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                        {translateResourceType(t, log.resourceType)} <span className="text-slate-400 dark:text-slate-500 font-normal">#{log.resourceId?.substring(0, 8)}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="text-slate-500 dark:text-slate-400">{t('profile.noActivity')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
