import Link from 'next/link';
import { getT } from '@/i18n/getT';

export default async function NotFound() {
  const { t } = await getT();
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060b1a] flex flex-col items-center justify-center text-slate-900 dark:text-slate-100 px-6">
      <div className="flex flex-col items-center max-w-md text-center">
        <h1 className="text-9xl font-black text-zinc-800 tracking-tighter select-none">404</h1>
        <h2 className="text-2xl font-bold mt-4">{t('tail.pageNotFound')}</h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2 mb-8 leading-relaxed">{t('tail.pageNotFoundDesc')}</p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <Link 
            href="/"
            className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm font-medium rounded-lg transition-colors w-full sm:w-auto"
          >{t('tail.goHome')}</Link>
          <Link 
            href="/dashboard/client"
            className="px-6 py-2.5 bg-blue-700 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20 w-full sm:w-auto"
          >{t('tail.goToDashboard')}</Link>
        </div>
      </div>
    </div>
  );
}
