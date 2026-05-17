'use client';

import { Sparkles } from 'lucide-react';

export default function RestartTourButton() {
  const handleClick = () => {
    try {
      localStorage.removeItem('onboarding_completed_v1');
    } catch {}
    window.dispatchEvent(new Event('onboarding:restart'));
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-indigo-300 bg-zinc-800/50 hover:bg-indigo-500/10 border border-zinc-700 hover:border-indigo-500/30 px-3 py-1.5 rounded-lg transition-colors"
      title="Replay the welcome tour"
    >
      <Sparkles className="h-3.5 w-3.5" />
      Replay tour
    </button>
  );
}
