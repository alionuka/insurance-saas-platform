'use client';

import { Sparkles } from 'lucide-react';
import { useT } from '@/i18n/LocaleProvider';

export default function RestartTourButton() {
  const { t } = useT();

  const handleClick = () => {
    try {
      localStorage.removeItem('onboarding_completed_v1');
    } catch {}
    window.dispatchEvent(new Event('onboarding:restart'));
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-teal-300 bg-zinc-800/50 hover:bg-teal-500/10 border border-zinc-700 hover:border-teal-500/30 px-3 py-1.5 rounded-lg transition-colors"
      title={t('onboarding.buttons.restart')}
    >
      <Sparkles className="h-3.5 w-3.5" />
      {t('onboarding.buttons.restart')}
    </button>
  );
}
