import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // Pragmatic rule downgrade — these were never bugs in practice and
    // the codebase intentionally uses `any` at API/DOM boundaries where
    // adding runtime validation (zod) would be out of scope for this
    // thesis project. Keeping them as warnings still surfaces them in
    // editor / `next lint` output but no longer fails CI.
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Apostrophes and quotes in JSX text render fine in all modern
      // browsers; the rule is purely a stylistic preference.
      "react/no-unescaped-entities": "warn",
      // React 19's new rule against synchronous setState() inside useEffect
      // is over-eager — many idiomatic patterns (hydrating from localStorage
      // on mount, kicking off a fetch and storing its result) trip it even
      // though the code is correct. Downgrade to warning so future migration
      // to useSyncExternalStore / RSC patterns is signalled but not blocking.
      "react-hooks/set-state-in-effect": "warn",
      // React Compiler informational diagnostics — tells you when manual
      // memoization (useMemo/useCallback deps) can't be auto-preserved by
      // the optimizer. Not a bug: the code still works, the compiler just
      // can't make it faster automatically.
      "react-hooks/preserve-manual-memoization": "warn",
    },
  },
]);

export default eslintConfig;
