'use client';

/**
 * ThemeToggle — segmented Light / Dark / System control.
 *
 * Two visual variants:
 *   - `pill` — three-segment pill, fits the landing-page nav next to the
 *              locale switcher. Compact, 36 px tall, icons + screen-
 *              reader-only labels.
 *   - `menu` — single-button cycle (Sun → Moon → Laptop), fits sidebar
 *              footers where horizontal room is tight.
 *
 * Reads/writes through the ThemeProvider context so all consumers stay
 * in sync.
 */

import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme, type Theme } from './ThemeProvider';
import { useT } from '@/i18n/LocaleProvider';

type Variant = 'pill' | 'menu';

const ORDER: Theme[] = ['light', 'dark', 'system'];

const ICONS: Record<Theme, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Laptop,
};

export default function ThemeToggle({
  variant = 'pill',
}: {
  variant?: Variant;
}) {
  const { theme, setTheme } = useTheme();
  const { t } = useT();

  const labels: Record<Theme, string> = {
    light: t('theme.light'),
    dark: t('theme.dark'),
    system: t('theme.system'),
  };

  if (variant === 'menu') {
    // Single-button cycle. Click rotates light → dark → system → light.
    const Icon = ICONS[theme];
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    return (
      <button
        type="button"
        onClick={() => setTheme(next)}
        aria-label={`${labels[theme]} → ${labels[next]}`}
        title={labels[theme]}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Icon className="h-4 w-4" />
      </button>
    );
  }

  // Pill variant — three radio-style segments, current one filled.
  return (
    <div
      role="radiogroup"
      aria-label={t('theme.label')}
      className="inline-flex items-center rounded-full border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm p-0.5"
    >
      {ORDER.map((mode) => {
        const Icon = ICONS[mode];
        const selected = theme === mode;
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={labels[mode]}
            title={labels[mode]}
            onClick={() => setTheme(mode)}
            className={[
              'inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors',
              selected
                ? 'bg-blue-700 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100',
            ].join(' ')}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
