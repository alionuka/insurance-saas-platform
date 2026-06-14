import Link from 'next/link';

export default function DashboardNotFound() {
  return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <div className="bg-white border border-slate-200 rounded-2xl p-10 max-w-md w-full text-center shadow-2xl">
        <div className="text-6xl font-black text-zinc-800 tracking-tighter select-none mb-4">
          404
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Page not found in your dashboard
        </h2>
        <p className="text-sm text-slate-600 mb-8">
          This section doesn't exist or you don't have permission to access it.
        </p>
        <Link 
          href="/dashboard/client"
          className="inline-flex items-center px-6 py-2.5 bg-blue-700 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20"
        >
          Return to Overview
        </Link>
      </div>
    </div>
  );
}
