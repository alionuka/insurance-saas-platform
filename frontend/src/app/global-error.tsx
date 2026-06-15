'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
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
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-slate-50 dark:bg-[#060b1a] text-slate-900 dark:text-slate-100">
        <div className="min-h-screen flex flex-col items-center justify-center p-8">
          <h1 className="text-4xl font-bold mb-4">{t('tail.somethingWrong')}</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6 text-center max-w-md">{t('tail.globalErrorMsg')}</p>
          <button
            onClick={reset}
            className="px-6 py-3 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm font-medium transition-colors"
          >{t('tail.tryAgain')}</button>
        </div>
      </body>
    </html>
  );
}
