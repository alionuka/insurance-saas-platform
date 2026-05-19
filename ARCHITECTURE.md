# Architecture

## System Overview

InsurSaaS is a multi-tenant insurance SaaS platform built as four loosely-coupled services. The frontend, backend, and ML service each run as independent processes that communicate over HTTP. A managed PostgreSQL database holds all persistent state.

```
┌──────────────────┐     HTTPS      ┌──────────────────┐    HTTP    ┌──────────────────┐
│  Next.js 16      │ ──────────────▶│  NestJS 11       │ ──────────▶│  FastAPI         │
│  (frontend)      │                │  (backend API)   │            │  (ml-service)    │
│  Vercel CDN      │                │  Railway         │            │  Railway         │
└──────────────────┘                └────────┬─────────┘            └──────────────────┘
                                             │ Prisma
                                             ▼
                                    ┌──────────────────┐
                                    │  PostgreSQL 15   │
                                    │  Railway managed │
                                    └──────────────────┘
```

## Service Responsibilities

### Frontend — Next.js 16 (Vercel)
- 4 role-aware dashboards (CUSTOMER / AGENT / COMPANY_ADMIN / PLATFORM_ADMIN)
- App Router with React Server Components for SEO-friendly static rendering of public pages and server-side data fetching for protected pages
- Edge middleware (`proxy.ts`) verifies JWT cookies before routing into `/dashboard/*`; on access-token expiry it automatically refreshes via the backend
- Client components handle interactive forms, ML chart visualisations (Recharts), Cmd+K global search, Sonner toasts, onboarding tour
- Auto-deployed from GitHub on every `main` push

### Backend — NestJS 11 (Railway)
- REST API with 32+ endpoints across 11 domain modules (auth, users, companies, products, applications, policies, claims, payments, recommendations, audit, admin)
- **Authentication** — JWT HS256 with 15-minute access tokens and 7-day rotating refresh tokens (one-time-use, hashed in DB). bcrypt(cost=10) for password storage. Throttler at 100 req/min globally and 5/min on `/auth/login`.
- **RBAC** — declarative via `@Roles()` decorator plus `RolesGuard`. Four roles, with COMPANY_ADMIN scoped to its tenant's products (visibility filtered by `product.companyId`).
- **Audit log** — 18+ event types persisted with actor identity, IP, resource, and metadata. Every meaningful state change leaves a trail.
- **Payments** — Stripe Checkout integration with webhook signature verification. Webhook handler atomically marks policies ACTIVE and records the payment.
- **Observability** — Sentry for exception capture, `nestjs-pino` for structured JSON logs with per-request UUID `requestId`, split `/health/live` and `/health/ready` probes that check DB + ML service.
- **Auto-generated OpenAPI** at `/api/docs` (Swagger UI) covering all endpoints with Bearer auth, request/response shapes, examples.

### ML Service — FastAPI + scikit-learn (Railway)
Three production-grade ML pipelines, each trained with rigorous methodology:

| Model | Algorithm | Validation | Test Metric |
|---|---|---|---|
| Risk Scoring | Gradient Boosting (winner via GridSearchCV across LR / RF / GB) | 5-fold StratifiedKFold | Test ROC-AUC **0.78** |
| Fraud Detection | Logistic Regression + TF-IDF (ablation study vs numeric-only) | 5-fold StratifiedKFold | Test ROC-AUC **0.91** |
| Recommendations | Content-based, TF-IDF + cosine similarity | demographic profile match | tracked per-profile |

- **SHAP explainability** — per-prediction feature contributions returned by `/risk/predict` and `/fraud/detect`, persisted alongside each assessment, and visualised as horizontal bar charts in the frontend
- **Permutation importance** (n_repeats=15) reported in training metrics for global feature ranking
- **Static plots** (CV box-plots, ROC curves, confusion matrices) served at `/plots/*` for the admin ML methodology dashboard
- Lifespan loader warms all three models on startup; gracefully falls back to rule-based heuristics if a `.joblib` file is missing

### Database — PostgreSQL 15 (Railway managed)
- 14 Prisma models including 3 enums (`UserRole`, `ApplicationStatus`, `ClaimStatus`)
- Foreign keys with cascade deletes where ownership semantics demand
- `RiskAssessment.featureContributions` and `FraudAssessment.featureContributions` as JSONB for flexible SHAP storage
- Single-writer migration model — `prisma migrate deploy` runs on every backend container start
- See `prisma/schema.prisma` for the source-of-truth schema

---

## Request Flow — Submitting an Application

```
Customer browser
    │
    │  POST /applications  { productId }
    ▼
Vercel CDN  ───▶  Next.js client component (apiFetch wrapper)
    │              attaches Bearer <access_token>
    │              auto-refreshes on 401 via /auth/refresh
    ▼
Railway backend (NestJS)
    │
    │  1. JwtAuthGuard validates token
    │  2. Application created with PENDING status
    │  3. POST /risk/predict (internal Railway network)
    ▼
ML service (FastAPI)
    │
    │  4. Loads features, runs Gradient Boosting model
    │  5. SHAP explainer computes per-feature contributions
    │  6. Returns { riskScore, riskLevel, explanation, featureContributions }
    ▼
Backend persists RiskAssessment + AuditLog inside one transaction
    │
    │  7. Email notification sent via Resend (best-effort)
    │  8. Returns Application with eager-loaded riskAssessments
    ▼
Frontend redirects customer to /dashboard/client/applications/<id>
    │  9. Server component renders Risk Score, ML Analysis text,
    │     and horizontal bar chart from featureContributions JSON
```

## Deployment Topology

```
                    ┌────────────────────────────────────────┐
                    │           GitHub (main branch)         │
                    └──────────────┬─────────────────────────┘
                                   │ push triggers webhooks
                ┌──────────────────┴────────────────────┐
                │                                       │
                ▼                                       ▼
        ┌─────────────┐                         ┌─────────────┐
        │   Vercel    │                         │   Railway   │
        │  (frontend) │                         │ (3 services)│
        ├─────────────┤                         ├─────────────┤
        │ • CDN edge  │       HTTPS  ◀────────  │ • backend   │
        │ • Auto SSL  │                         │ • ml-service│
        │ • Preview   │                         │ • postgres  │
        │   per PR    │                         │ • internal  │
        └─────────────┘                         │   DNS       │
                                                └─────────────┘
```

- **GitHub Actions CI** runs typecheck + e2e (with Postgres service container) on every push before deployment
- **Vercel** builds the Next.js project from `frontend/`, ENV vars wire it to the Railway backend URL
- **Railway** builds each service from its own Dockerfile in `backend/` and `ml-service/`, all three share a private network for service-to-service calls
- Postgres backups via `scripts/backup-db.sh` (manual or cron) — Railway also offers daily snapshots on Pro plan

## Security Considerations

- **JWT** signed with HS256 + a 32+ character secret stored as env var (not in code). Access tokens deliberately short-lived (15 min) so leaked tokens have limited blast radius.
- **Refresh tokens** are hashed with bcrypt before storage so a DB leak cannot impersonate users. One-time use prevents replay; rotation issues a fresh token on every refresh.
- **bcrypt(10)** for passwords; the salt rounds give a >100ms hash cost which throttles credential-stuffing.
- **Rate limiting** via `@nestjs/throttler` — 100 req/min globally, 3/min on registration, 5/min on login.
- **CORS** allow-list configured per-environment via `CORS_ORIGINS` (supports regex for Vercel preview URLs).
- **Stripe webhook** verifies signature with the platform's webhook secret before mutating any policy state.
- **Audit log** captures every privileged action (status changes, payments, admin operations) for compliance review.
- **Validation pipes** on every endpoint via `class-validator` decorators reject malformed input at the boundary.

## Local Development

```
docker compose up -d            # one command: db + backend + ml-service + frontend
```

For iterative frontend development, run frontend locally via `npm run dev` so Server Components can reach `localhost:3001` directly (Docker frontend doesn't have access to the host network for SSR fetches).

See `README.md` for full quick-start.
