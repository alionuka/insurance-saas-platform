'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { useT } from '@/i18n/LocaleProvider';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useT();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060b1a] flex flex-col items-center justify-center text-slate-900 dark:text-slate-100 px-6">
      <div className="flex flex-col items-center max-w-md text-center">
        <div className="h-20 w-20 rounded-full bg-rose-500/10 flex items-center justify-center mb-6">
          <AlertCircle className="h-10 w-10 text-rose-500" />
        </div>
        <h2 className="text-2xl font-bold">{t('tail.somethingWrong')}</h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2 mb-6 leading-relaxed">{t('tail.errorMsg')}</p>

        {error.message && (
          <details className="w-full text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 mb-8">
            <summary className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-300">{t('tail.errorDetails')}</summary>
            <p className="text-sm font-mono text-rose-700 dark:text-rose-400 mt-3 whitespace-pre-wrap break-all">
              {error.message}
            </p>
          </details>
        )}
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <button 
            onClick={() => reset()}
            className="px-6 py-2.5 bg-blue-700 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20 w-full sm:w-auto"
          >{t('tail.tryAgain')}</button>
          <Link 
            href="/"
            className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm font-medium rounded-lg transition-colors w-full sm:w-auto"
          >{t('tail.goHome')}</Link>
        </div>
      </div>
    </div>
  );
}
