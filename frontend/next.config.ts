import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  // Only emit standalone bundle when building for Docker — otherwise let
  // Vercel use its own optimised output (avoids App Router edge cases).
  ...(process.env.STANDALONE_BUILD === 'true' ? { output: 'standalone' as const } : {}),
  // Pin Turbopack workspace root to this directory — otherwise it walks up
  // and finds the monorepo root package.json, then fails to resolve frontend
  // deps like tailwindcss from the wrong node_modules.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

const exportedConfig = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, { silent: true })
  : nextConfig;

export default exportedConfig;
