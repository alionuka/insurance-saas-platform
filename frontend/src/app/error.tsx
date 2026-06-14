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
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white px-6">
      <div className="flex flex-col items-center max-w-md text-center">
        <div className="h-20 w-20 rounded-full bg-rose-500/10 flex items-center justify-center mb-6">
          <AlertCircle className="h-10 w-10 text-rose-500" />
        </div>
        <h2 className="text-2xl font-bold">Something went wrong</h2>
        <p className="text-zinc-400 mt-2 mb-6 leading-relaxed">
          We encountered an unexpected error while trying to process your request.
        </p>

        {error.message && (
          <details className="w-full text-left bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-8">
            <summary className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-300">
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
            className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-teal-500/20 w-full sm:w-auto"
          >
            Try again
          </button>
          <Link 
            href="/"
            className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors w-full sm:w-auto"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
