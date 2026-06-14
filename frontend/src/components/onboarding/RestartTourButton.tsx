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
      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 bg-slate-100/50 hover:bg-blue-700/10 border border-slate-300 hover:border-blue-700/30 px-3 py-1.5 rounded-lg transition-colors"
      title={t('onboarding.buttons.restart')}
    >
      <Sparkles className="h-3.5 w-3.5" />
      {t('onboarding.buttons.restart')}
    </button>
  );
}
