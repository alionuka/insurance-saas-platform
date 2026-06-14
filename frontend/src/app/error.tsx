'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-900 px-6">
      <div className="flex flex-col items-center max-w-md text-center">
        <div className="h-20 w-20 rounded-full bg-rose-500/10 flex items-center justify-center mb-6">
          <AlertCircle className="h-10 w-10 text-rose-500" />
        </div>
        <h2 className="text-2xl font-bold">Something went wrong</h2>
        <p className="text-slate-600 mt-2 mb-6 leading-relaxed">
          We encountered an unexpected error while trying to process your request.
        </p>

        {error.message && (
          <details className="w-full text-left bg-white border border-slate-200 rounded-lg p-4 mb-8">
            <summary className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700">
              Error Details
            </summary>
            <p className="text-sm font-mono text-rose-400 mt-3 whitespace-pre-wrap break-all">
              {error.message}
            </p>
          </details>
        )}
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <button 
            onClick={() => reset()}
            className="px-6 py-2.5 bg-blue-700 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20 w-full sm:w-auto"
          >
            Try again
          </button>
          <Link 
            href="/"
            className="px-6 py-2.5 bg-slate-100 hover:bg-zinc-700 text-slate-900 text-sm font-medium rounded-lg transition-colors w-full sm:w-auto"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
