/**
 * Translate enum-like status values from the backend into localized labels.
 *
 * Backend always returns canonical SCREAMING_SNAKE_CASE values for status
 * fields (e.g., `ACTIVE`, `PENDING_PAYMENT`, `LOW`, `SUSPICIOUS`). The UI
 * shows these in pills/badges, where the raw English wording leaks through
 * even on Ukrainian locale. This helper takes the canonical value and a
 * `t` function from `useT()` / `getT()` and returns a translated label.
 *
 * Usage:
 *   const { t } = useT();
 *   <span>{translateStatus(t, policy.status)}</span>
 */

type TFn = (key: string) => string;

export function translateStatus(t: TFn, status: string | null | undefined): string {
  if (!status) return '';
  const map: Record<string, string> = {
    // Application / claim status
    PENDING: t('dashboard.statusPending'),
    APPROVED: t('dashboard.statusApproved'),
    REJECTED: t('dashboard.statusRejected'),
    UNDER_REVIEW: t('dashboard.statusUnderReview'),
    FILED: t('dashboard.statusFiled'),
    IN_PROGRESS: t('dashboard.statusInProgress'),
    DENIED: t('dashboard.statusDenied'),
    // Policy status
    ACTIVE: t('dashboard.statusActive'),
    PENDING_PAYMENT: t('dashboard.statusPendingPayment'),
    EXPIRED: t('dashboard.statusExpired'),
    CANCELLED: t('dashboard.statusCancelled'),
  };
  return map[status] ?? status.replace(/_/g, ' ');
}

/** Translate risk-level enum (LOW / MEDIUM / HIGH). */
export function translateRiskLevel(
  t: TFn,
  level: string | null | undefined,
): string {
  if (!level) return '';
  const map: Record<string, string> = {
    LOW: t('riskLevels.low'),
    MEDIUM: t('riskLevels.medium'),
    HIGH: t('riskLevels.high'),
  };
  return map[level] ?? level;
}

/** Translate fraud flag enum (NORMAL / SUSPICIOUS / FRAUDULENT). */
export function translateFraudFlag(
  t: TFn,
  flag: string | null | undefined,
): string {
  if (!flag) return '';
  // Reuse status keys where overlap exists; otherwise fall back to raw.
  const map: Record<string, string> = {
    NORMAL: t('riskLevels.low'),
    SUSPICIOUS: t('dashboard.statFlagged'),
  };
  return map[flag] ?? flag;
}

/**
 * Translate audit log action enums emitted by the backend.
 * Keys live under `audit.action.*` in messages.ts. Unknown actions fall
 * back to a human-readable version (underscores → spaces).
 */
export function translateAuditAction(
  t: TFn,
  action: string | null | undefined,
): string {
  if (!action) return '';
  // Use a single lookup against a localised key; if missing, default to
  // the raw underscore-stripped form so unknown actions still display.
  const key = `audit.action.${action}`;
  const translated = t(key);
  // Convention: getT returns the dotted key itself if no translation
  // was found. In that case use a graceful fallback.
  if (translated === key) return action.replace(/_/g, ' ');
  return translated;
}

/** Translate backend resource type names (User, Policy, Claim, ...). */
export function translateResourceType(
  t: TFn,
  type: string | null | undefined,
): string {
  if (!type) return '';
  const key = `audit.resource.${type}`;
  const translated = t(key);
  if (translated === key) return type;
  return translated;
}

/**
 * Translate user role enums (CUSTOMER, AGENT, COMPANY_ADMIN,
 * PLATFORM_ADMIN). Backend stores them as the canonical
 * SCREAMING_SNAKE form; the UI shows the localised label.
 */
export function translateRole(
  t: TFn,
  role: string | null | undefined,
): string {
  if (!role) return '';
  const map: Record<string, string> = {
    CUSTOMER: t('roles.customer'),
    AGENT: t('roles.agent'),
    COMPANY_ADMIN: t('roles.companyAdmin'),
    PLATFORM_ADMIN: t('roles.platformAdmin'),
  };
  return map[role] ?? role.replace(/_/g, ' ');
}
