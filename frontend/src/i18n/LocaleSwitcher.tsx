'use client';

import { Globe } from 'lucide-react';
import { useT } from './LocaleProvider';
import type { Locale } from './messages';

/**
 * Compact globe-icon language switcher.
 *
 * Variant `nav` is used inside the dashboard sidebar header (zinc background).
 * Variant `landing` is for the landing/auth pages (slate-on-dark hero).
 */
export default function LocaleSwitcher({
  variant = 'nav',
}: {
  variant?: 'nav' | 'landing';
}) {
  const { locale, setLocale, t } = useT();
  const next: Locale = locale === 'en' ? 'uk' : 'en';

  const base =
    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider transition-colors';
  const styles =
    variant === 'landing'
      ? 'bg-slate-800/60 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700/60 backdrop-blur-sm'
      : 'border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/50';

  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      className={`${base} ${styles}`}
      title={`${t('common.language')}: ${locale.toUpperCase()} → ${next.toUpperCase()}`}
      aria-label={`Switch language to ${next.toUpperCase()}`}
    >
      <Globe className="h-3.5 w-3.5" />
      <span>{locale.toUpperCase()}</span>
    </button>
  );
}
