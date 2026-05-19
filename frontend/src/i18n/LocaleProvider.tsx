'use client';

// Client-side locale context. Mirrors the server-side `getT` helper so the
// same `messages.ts` source-of-truth backs both sides.
//
// The provider is mounted at the root layout with `initialLocale` read from
// the `locale` cookie on the server. When the user toggles language we
// write the cookie and call `router.refresh()` so Server Components re-fetch
// with the new locale — no full page reload, no flash of English content.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { messages, type Locale } from './messages';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: (k) => k,
});

function lookup(locale: Locale, key: string): string {
  const parts = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let val: any = messages[locale];
  for (const p of parts) {
    if (val == null) break;
    val = val[p];
  }
  if (typeof val === 'string') return val;
  if (locale !== 'en') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let enVal: any = messages.en;
    for (const p of parts) {
      if (enVal == null) break;
      enVal = enVal[p];
    }
    if (typeof enVal === 'string') return enVal;
  }
  return key;
}

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const router = useRouter();

  const setLocale = useCallback(
    (l: Locale) => {
      // Persist for one year. SameSite=Lax is sufficient since the cookie
      // isn't security-sensitive.
      document.cookie = `locale=${l}; path=/; max-age=31536000; SameSite=Lax`;
      setLocaleState(l);
      // Refresh server-rendered surfaces with the new cookie value.
      router.refresh();
    },
    [router],
  );

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key: string) => lookup(locale, key),
    }),
    [locale, setLocale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useT() {
  return useContext(LocaleContext);
}
