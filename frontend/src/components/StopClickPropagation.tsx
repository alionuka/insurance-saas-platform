'use client';

import { ReactNode } from 'react';

/**
 * Wraps children so clicks inside don't bubble up to ancestor handlers.
 * Useful when interactive elements (buttons, details) live inside a Link
 * and we want their clicks not to trigger navigation.
 */
export default function StopClickPropagation({ children }: { children: ReactNode }) {
  return <div onClick={(e) => e.stopPropagation()}>{children}</div>;
}
