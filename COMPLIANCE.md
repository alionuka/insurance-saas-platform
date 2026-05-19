# Compliance & Data Residency

This document covers the regulatory posture of InsurSaaS — what data is collected,
where it lives, who can access it, and how user rights under GDPR are honoured.

## TL;DR

- **GDPR Article 17** (right to erasure) — implemented as `DELETE /auth/me`. One transaction, cascades through all user-owned tables.
- **GDPR Article 20** (right to data portability) — implemented as `GET /auth/me/export`. Returns a downloadable JSON dump of all user data.
- **Data residency** — all user data can be pinned to EU regions across the three hosting providers we use. See [Region Configuration](#region-configuration) below.
- **Encryption** — TLS in transit (all three providers enforce HTTPS), AES-256 at rest (managed by providers).
- **Audit trail** — every privileged action (login, register, password change, application/claim/policy mutation, payment, GDPR export/delete) is written to an immutable `AuditLog` row keyed by actor + resource.

## Region Configuration

InsurSaaS is hosted on three providers. Each supports an EU region selection,
which means data **does not need to leave the EU** at any point in the request
lifecycle for a user located in Europe.

### Frontend — Vercel

Vercel serves the Next.js application from a global edge network. Static
assets and Server Components can be pinned to EU edge regions through the
project's `Regions` setting in Vercel dashboard:

- Production region: **fra1** (Frankfurt, Germany) — recommended for EU users
- Alternative EU regions: **arn1** (Stockholm), **cdg1** (Paris), **dub1** (Dublin), **lhr1** (London)

Server Components fetch data from the backend over HTTPS. Set
`Settings → Functions → Region → fra1` for all serverless functions, which
ensures no cross-Atlantic round-trips for SSR pages.

### Backend + Database + ML — Railway

Railway exposes region selection per service. Set each of the three services
to **EU West (Amsterdam)** in the project's environment settings:

- `backend` (NestJS) — Region: EU West
- `ml-service` (FastAPI) — Region: EU West
- `postgres` (managed Postgres 15) — Region: EU West

Once set, all database queries, ML inference calls, and inter-service HTTP
remain inside Amsterdam datacenters. Postgres backups (automated daily by
Railway) are also stored in EU.

### File storage — Cloudflare R2

R2 buckets have a `jurisdiction` attribute. Set the bucket to **EU**:

```bash
# Cloudflare dashboard: R2 → Bucket settings → Jurisdiction → EU
# Or via wrangler:
npx wrangler r2 bucket create insurance-claims-prod --jurisdiction eu
```

Data written to the bucket (claim documents, profile uploads) is stored
within EU datacenters and **never replicates to US or Asia regions** unless
explicitly enabled.

### Verification

The configured regions can be verified at any time:

```bash
# Vercel: dashboard → project → Settings → Functions → Region
# Railway: dashboard → service → Settings → Region
# Cloudflare R2: dashboard → R2 → bucket → Settings → Jurisdiction
```

## User Rights — GDPR Implementation

### Article 17 — Right to Erasure (DELETE /auth/me)

A user can permanently delete their account from the Profile page (`/dashboard/profile`):

1. Click "Delete account" in the Data Rights panel.
2. Confirm by entering current password (defence against CSRF + accidental clicks).
3. Backend runs one atomic transaction that:
   - Deletes claim documents (R2 files + DB rows)
   - Deletes fraud assessments, claims
   - Deletes risk assessments, applications
   - Deletes policies and payments
   - Deletes recommendations
   - Deletes refresh tokens + password reset tokens (cascade)
   - Deletes the `User` row itself
4. Audit-log entry written with the now-orphaned `actor.id` for traceability.
5. Operation is atomic — if any step fails, the whole erasure rolls back.

Implementation: `backend/src/auth/auth.service.ts → deleteAccount()`.

### Article 20 — Right to Data Portability (GET /auth/me/export)

A user can download all their data as JSON from the same Data Rights panel:

1. Click "Export my data".
2. Backend gathers: user profile, applications, policies, claims, payments,
   recommendations, audit-log entries.
3. Response is `application/json` with `Content-Disposition: attachment`.
4. The export is signed by the user's current session — no anonymous exports.

Implementation: `backend/src/auth/auth.service.ts → exportData()`.

### Article 15 — Right of Access (GET /auth/me)

Every authenticated user can retrieve their own profile and metadata at any
time via the profile endpoint. Backend never returns other users' data
through this endpoint regardless of role.

### Article 32 — Security of Processing

- Passwords are hashed with bcrypt (10 rounds) before storage. The plain
  password is never persisted or logged.
- Access tokens are JWT (HS256) with a 15-minute TTL; refresh tokens are
  rotated on every use and bound to a single device session.
- All inter-service traffic uses HTTPS in production. The ML service requires
  an internal API key (`X-Internal-API-Key`) for risk/fraud/recommendation
  endpoints — the backend is the only authorised caller.
- Sentry collects error reports but is configured to strip request bodies and
  query strings that may contain PII.
- Stripe handles all card data; we store only the Stripe session ID and the
  payment status — never the card number, CVV, or holder details.

## Data Inventory

| Data Class | Where Stored | EU-Resident? | Retention |
|---|---|---|---|
| User profile (name, email, age, income) | Postgres | Yes (EU West) | Until account deletion |
| Authentication credentials (bcrypt hash) | Postgres | Yes (EU West) | Until account deletion |
| Refresh tokens | Postgres | Yes (EU West) | 7 days or until revoked |
| Insurance applications | Postgres | Yes (EU West) | Until account deletion |
| Risk + fraud assessments (SHAP scores) | Postgres | Yes (EU West) | Tied to parent application/claim |
| Policy + payment records | Postgres | Yes (EU West) | 10 years (financial record retention) — overrides user erasure for non-PII fields |
| Claim documents (images, PDFs) | Cloudflare R2 | Yes (EU jurisdiction) | Until account deletion |
| Audit logs | Postgres | Yes (EU West) | 2 years (immutable, anonymised on user delete) |
| Email notifications | Resend (transit only — no storage) | EU SMTP via Resend EU region | Not stored after delivery |
| Error reports | Sentry (Germany) | Yes — `ingest.de.sentry.io` | 90 days (Sentry default) |

## Retention Exception — Financial Records

Policy and payment records have a legal retention requirement of 10 years
under most EU jurisdictions (anti-money-laundering directives). When a user
exercises Article 17 erasure:

- PII fields (`firstName`, `lastName`, `email`, etc.) are anonymised on the
  user row, but the user row itself **is not deleted** in cases where
  outstanding financial records reference it. Current implementation deletes
  the user row entirely — for production deployments serving real payments,
  this should be replaced with anonymisation-only behaviour.
- Audit logs referencing the now-deleted user keep the `actor.id` value but
  no longer resolve to any current user — this satisfies the audit trail
  retention obligation without violating erasure.

For this thesis project the simpler "delete everything" path is implemented;
the comment in `auth.service.ts → deleteAccount()` flags this trade-off.

## Cross-Border Data Transfers

In the default configuration described above, **no data crosses EU borders**
during normal operation. The exceptions are:

- **Stripe** — payment processing routes through Stripe's global network.
  Stripe is GDPR-compliant and a "Standard Contractual Clauses"
  data processor under EU law.
- **Resend** (email delivery) — configured to use Resend's EU SMTP endpoint
  (`api.resend.com/eu`). Email content includes user email + first name + claim
  ID — no sensitive financial data.

Both transfers are covered by Standard Contractual Clauses (SCCs) as
specified in Article 46(2)(c) GDPR.

## Verification Checklist for Auditors

```
[ ] Frontend deployed to a fra1/arn1/cdg1/dub1 Vercel region
[ ] Backend deployed to Railway EU West
[ ] ML service deployed to Railway EU West
[ ] Postgres provisioned in Railway EU West
[ ] Cloudflare R2 bucket jurisdiction set to EU
[ ] Stripe webhook endpoint signed verification active
[ ] Sentry project region set to EU (de.sentry.io)
[ ] DELETE /auth/me end-to-end test passing (Playwright)
[ ] GET /auth/me/export returns valid JSON dump
[ ] Audit log entries written for every privileged mutation
[ ] No PII strings appear in production logs (pino redact rules in place)
```

---

For implementation details see:
- `backend/src/auth/auth.service.ts` — Article 17 + 20 implementation
- `backend/src/audit/audit.service.ts` — audit log writer
- `backend/src/ml-client/ml-client.service.ts` — ML API key auth
- `frontend/src/app/dashboard/profile/GdprPanel.tsx` — user-facing UI
- `ARCHITECTURE.md` — system architecture overview
