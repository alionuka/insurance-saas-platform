'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-zinc-950 text-white">
        <div className="min-h-screen flex flex-col items-center justify-center p-8">
          <h1 className="text-4xl font-bold mb-4">Something went wrong</h1>
          <p className="text-zinc-400 mb-6 text-center max-w-md">
            An unexpected error occurred. Our team has been notified.
          </p>
          <button
            onClick={reset}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-600 rounded-lg text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
