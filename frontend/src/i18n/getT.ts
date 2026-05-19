// Server-side translation helper.
//
// Used by Server Components (e.g. dashboard pages that read cookies and call
// the backend with the access_token). Reads the `locale` cookie and returns a
// `t(key)` lookup function that walks the messages tree for the active locale.
//
// Client Components should use `useT()` from LocaleProvider instead — the two
// share the same messages source-of-truth and key paths.

import { cookies } from 'next/headers';
import { messages, type Locale } from './messages';

function lookup(locale: Locale, key: string): string {
  const parts = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let val: any = messages[locale];
  for (const p of parts) {
    if (val == null) break;
    val = val[p];
  }
  if (typeof val === 'string') return val;
  // Fallback to English if a key isn't translated yet — better than blanks.
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

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const val = store.get('locale')?.value;
  return val === 'uk' ? 'uk' : 'en';
}

export async function getT(): Promise<{
  t: (key: string) => string;
  locale: Locale;
}> {
  const locale = await getLocale();
  return {
    locale,
    t: (key: string) => lookup(locale, key),
  };
}
