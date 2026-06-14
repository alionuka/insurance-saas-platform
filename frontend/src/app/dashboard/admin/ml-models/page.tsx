import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Brain, ShieldAlert } from 'lucide-react';
import MlModelsTabs from './MlModelsTabs';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getMlModelsData() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return { data: null, forbidden: true };

    const res = await fetch(`${API_URL}/admin/ml-models`, {
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (res.status === 403) return { data: null, forbidden: true };
    if (!res.ok) return { data: null, forbidden: false };

    const data = await res.json();
    return { data, forbidden: false };
  } catch (error) {
    console.error('Failed to fetch ML models data', error);
    return { data: null, forbidden: false };
  }
}

export default async function MlModelsDashboardPage() {
  const { data, forbidden } = await getMlModelsData();

  if (forbidden) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
            <Brain className="h-6 w-6 text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">ML Model Methodology</h1>
            <p className="text-zinc-400 mt-1">Metrics, training performance, and explainability artifacts</p>
          </div>
        </div>
      </div>

      {data ? (
        <MlModelsTabs data={data} />
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center max-w-lg mx-auto shadow-md">
          <div className="mx-auto h-12 w-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
            <ShieldAlert className="h-6 w-6 text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Metrics Not Available</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            The machine learning service metrics are currently offline or cannot be parsed. Please check if the ML service is running.
          </p>
        </div>
      )}
    </div>
  );
}
