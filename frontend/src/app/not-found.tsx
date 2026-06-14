import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060b1a] flex flex-col items-center justify-center text-slate-900 dark:text-slate-100 px-6">
      <div className="flex flex-col items-center max-w-md text-center">
        <h1 className="text-9xl font-black text-zinc-800 tracking-tighter select-none">404</h1>
        <h2 className="text-2xl font-bold mt-4">Page not found</h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2 mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <Link 
            href="/"
            className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-zinc-700 text-slate-900 dark:text-slate-100 text-sm font-medium rounded-lg transition-colors w-full sm:w-auto"
          >
            Go Home
          </Link>
          <Link 
            href="/dashboard/client"
            className="px-6 py-2.5 bg-blue-700 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20 w-full sm:w-auto"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
