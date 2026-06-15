import Link from 'next/link';
import { getT } from '@/i18n/getT';

export default async function DashboardNotFound() {
  const { t } = await getT();
  return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 max-w-md w-full text-center shadow-2xl">
        <div className="text-6xl font-black text-zinc-800 tracking-tighter select-none mb-4">
          404
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{t('tail.notFoundDashboard')}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-8">{t('tail.notFoundDashDesc')}</p>
        <Link 
          href="/dashboard/client"
          className="inline-flex items-center px-6 py-2.5 bg-blue-700 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20"
        >{t('tail.returnToOverview')}</Link>
      </div>
    </div>
  );
}
