import { ScrollText, ShieldX, Clock, User, Box, FileText, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/formatDate';
import { cookies } from 'next/headers';

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

  if (result.status === 401 || result.status === 403) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 border-2 border-dashed border-rose-900/30 rounded-3xl bg-rose-950/10 text-center">
        <ShieldX className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
        <p className="text-zinc-400 max-w-md">You do not have permission to view the system audit logs.</p>
      </div>
    );
  }

  if (result.status !== 200 || !result.data) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500 text-sm">Failed to load audit logs. Please try again later.</p>
      </div>
    );
  }

  const { items, total } = result.data;

  const getActionColor = (action: string) => {
    const a = action.toLowerCase();
    if (a.includes('login') || a.includes('register') || a.includes('password')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (a.includes('application') || a.includes('claim') || a.includes('policy')) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    if (a.includes('payment')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (a.includes('document')) return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    return 'bg-zinc-800 text-zinc-500 border-zinc-700';
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <ScrollText className="h-8 w-8 text-amber-400" />
          Audit Log
        </h1>
        <p className="text-zinc-400 mt-1">Platform-wide record of state-changing events.</p>
      </div>

      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-zinc-950 text-zinc-500 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4 border-b border-zinc-800">When</th>
                <th className="px-6 py-4 border-b border-zinc-800">Action</th>
                <th className="px-6 py-4 border-b border-zinc-800">Actor</th>
                <th className="px-6 py-4 border-b border-zinc-800">Resource</th>
                <th className="px-6 py-4 border-b border-zinc-800">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {items.map((log: any) => (
                <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Clock className="h-3 w-3 text-zinc-500" />
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
                      <div className="flex items-center gap-1.5 text-white font-bold text-xs">
                        <User className="h-3 w-3 text-zinc-500" />
                        {log.actorEmail || 'system'}
                      </div>
                      {log.actorRole && (
                        <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mt-0.5">
                          {log.actorRole}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {log.resourceType ? (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-zinc-300 text-xs font-mono">
                          <Box className="h-3 w-3 text-zinc-600" />
                          {log.resourceType}
                        </div>
                        {log.resourceId && (
                          <span className="text-[10px] text-zinc-500 font-mono mt-0.5">
                            #{log.resourceId.substring(0, 8)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-700">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <details className="group">
                      <summary className="list-none cursor-pointer flex items-center gap-1 text-[10px] font-bold uppercase text-amber-400 hover:text-amber-300 transition-colors">
                        <FileText className="h-3 w-3" />
                        View
                        <ChevronRight className="h-3 w-3 group-open:rotate-90 transition-transform" />
                      </summary>
                      <div className="mt-2 p-3 bg-zinc-950 rounded-lg border border-zinc-800 max-w-md overflow-x-auto shadow-inner">
                        <pre className="text-[10px] text-zinc-400 font-mono leading-relaxed">
                          {JSON.stringify(log.metadata || {}, null, 2)}
                        </pre>
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 italic">
                    No audit records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-zinc-950/50 border-t border-zinc-800 flex items-center justify-between">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            Showing 1–{items.length} of {total}
          </p>
          <div className="flex gap-2 text-[10px] font-bold text-zinc-600 uppercase">
            Pagination disabled in Phase 1
          </div>
        </div>
      </section>
    </div>
  );
}
