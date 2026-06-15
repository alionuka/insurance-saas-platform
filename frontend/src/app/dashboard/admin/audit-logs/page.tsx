import { ScrollText, ShieldX, Clock, User, Box, FileText, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/formatDate';
import { cookies } from 'next/headers';
import { getT } from '@/i18n/getT';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getAuditLogs() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value ?? '';
    if (!token) return { status: 401 };

    const res = await fetch(`${API_URL}/audit-logs?limit=100`, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401 || res.status === 403) {
      return { status: res.status };
    }

    if (!res.ok) return { status: res.status };

    return { data: await res.json(), status: 200 };
  } catch (error) {
    return { status: 500 };
  }
}

export default async function AuditLogPage() {
  const result = await getAuditLogs();
  const { t } = await getT();

  if (result.status === 401 || result.status === 403) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 border-2 border-dashed border-rose-900/30 rounded-3xl bg-rose-950/10 text-center">
        <ShieldX className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{t('dashboard.accessRestricted')}</h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-md">{t('dashboard.auditAccessDenied')}</p>
      </div>
    );
  }

  if (result.status !== 200 || !result.data) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 dark:text-slate-400 text-sm">{t('dashboard.auditLoadFailed')}</p>
      </div>
    );
  }

  const { items, total } = result.data;

  const getActionColor = (action: string) => {
    const a = action.toLowerCase();
    if (a.includes('login') || a.includes('register') || a.includes('password')) return 'bg-blue-700/10 text-blue-700 border-blue-700/20';
    if (a.includes('application') || a.includes('claim') || a.includes('policy')) return 'bg-blue-700/10 text-blue-700 border-blue-700/20';
    if (a.includes('payment')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (a.includes('document')) return 'bg-zinc-500/10 text-slate-600 border-zinc-500/20';
    return 'bg-slate-100 text-slate-500 border-slate-300';
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
          <ScrollText className="h-8 w-8 text-blue-700" />
          {t('dashboard.auditPageTitle')}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">{t('dashboard.auditPageSubtitle')}</p>
      </div>

      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 dark:bg-[#060b1a] text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">{t('dashboard.auditColWhen')}</th>
                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">{t('dashboard.auditColAction')}</th>
                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">{t('dashboard.auditColActor')}</th>
                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">{t('dashboard.auditColResource')}</th>
                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">{t('dashboard.auditColDetails')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {items.map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Clock className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                      <span className="font-medium text-xs">
                        {new Date(log.createdAt).toLocaleString([], { 
                          year: 'numeric', month: 'short', day: 'numeric', 
                          hour: '2-digit', minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${getActionColor(log.action)}`}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 text-slate-900 dark:text-slate-100 font-bold text-xs">
                        <User className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                        {log.actorEmail || 'system'}
                      </div>
                      {log.actorRole && (
                        <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest mt-0.5">
                          {log.actorRole}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {log.resourceType ? (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 text-xs font-mono">
                          <Box className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                          {log.resourceType}
                        </div>
                        {log.resourceId && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                            #{log.resourceId.substring(0, 8)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <details className="group">
                      <summary className="list-none cursor-pointer flex items-center gap-1 text-[10px] font-bold uppercase text-blue-700 hover:text-blue-600 transition-colors">
                        <FileText className="h-3 w-3" />
                        {t('dashboard.auditView')}
                        <ChevronRight className="h-3 w-3 group-open:rotate-90 transition-transform" />
                      </summary>
                      <div className="mt-2 p-3 bg-slate-50 dark:bg-[#060b1a] rounded-lg border border-slate-200 dark:border-slate-800 max-w-md overflow-x-auto shadow-inner">
                        <pre className="text-[10px] text-slate-600 dark:text-slate-400 font-mono leading-relaxed">
                          {JSON.stringify(log.metadata || {}, null, 2)}
                        </pre>
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 italic">
                    {t('dashboard.auditNoRecords')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-slate-50 dark:bg-[#060b1a]/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            {t('dashboard.auditShowing')}{items.length}{t('dashboard.auditOf')}{total}
          </p>
          <div className="flex gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
            {t('dashboard.auditPaginationDisabled')}
          </div>
        </div>
      </section>
    </div>
  );
}
