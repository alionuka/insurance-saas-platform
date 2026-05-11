'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser, getDashboardRedirect, UserRole } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

export default function DashboardEntry() {
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    const token = localStorage.getItem('access_token');

    if (!user || !token) {
      router.push('/auth/sign-in');
      return;
    }

    const redirectPath = getDashboardRedirect(user.role as UserRole);
    router.push(redirectPath);
  }, [router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
      <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Redirecting to your dashboard...</h1>
      <p className="text-zinc-400">Please wait while we verify your access.</p>
    </div>
  );
}

