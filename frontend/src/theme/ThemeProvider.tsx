'use client';

/**
 * Theme context — light / dark / system, persisted in localStorage,
 * reactive to OS-level `prefers-color-scheme` changes when in 'system'
 * mode.
 *
 * The companion inline script in `layout.tsx` (THEME_BOOT_SCRIPT) runs
 * BEFORE React hydrates and applies the correct `.dark` class to <html>,
 * which is what prevents the flash of wrong theme. This provider keeps
 * React state in sync with the same source of truth.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type Theme = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'theme';

interface ThemeContextValue {
  /** User's stored preference (light / dark / system). */
  theme: Theme;
  /** What's actually applied right now (resolves 'system' to one). */
  resolved: 'light' | 'dark';
  setTheme: (next: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Resolve a Theme preference to a concrete light/dark for rendering. */
function resolve(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/** Flip the actual `<html class="dark">` toggle. */
function applyClass(mode: 'light' | 'dark') {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', mode === 'dark');
  // Hint UA-level controls (form controls, scrollbars) to match.
  root.style.colorScheme = mode;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Read preference once on mount. SSR returns 'system' as a safe default.
  const [theme, setThemeState] = useState<Theme>('system');

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as
        | Theme
        | null;
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setThemeState(stored);
        applyClass(resolve(stored));
      } else {
        applyClass(resolve('system'));
      }
    } catch {
      /* localStorage blocked — fall back to system */
    }
  }, []);

  // Re-resolve when the OS preference flips and we're in 'system' mode.
  useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyClass(resolve('system'));
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    applyClass(resolve(next));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolved: resolve(theme),
      setTheme,
    }),
    [theme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return ctx;
}

/**
 * Inline boot script — paste into <head> via dangerouslySetInnerHTML.
 * Runs BEFORE React hydrates and BEFORE any paint, so the first frame
 * already has the right theme applied (no light→dark or dark→light
 * flash on reload).
 *
 * Mirrors the resolve/applyClass logic above. Kept tiny and dependency-
 * free on purpose — the cost is one localStorage read.
 */
export const THEME_BOOT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('${THEME_STORAGE_KEY}');
    var mode;
    if (stored === 'light' || stored === 'dark') {
      mode = stored;
    } else {
      mode = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    var root = document.documentElement;
    if (mode === 'dark') root.classList.add('dark');
    root.style.colorScheme = mode;
  } catch (e) {
    /* localStorage blocked — leave default light theme */
  }
})();
`.trim();
