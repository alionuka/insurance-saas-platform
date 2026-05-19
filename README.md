# InsurSaaS — Multi-Tenant Insurance Platform with ML

[![CI](https://github.com/alionuka/insurance-saas-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/alionuka/insurance-saas-platform/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.10-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Stripe](https://img.shields.io/badge/Stripe-payments-635BFF?logo=stripe&logoColor=white)](https://stripe.com/)
[![i18n](https://img.shields.io/badge/i18n-EN%20%2F%20UK-FFD700)](#-internationalisation)
[![GDPR](https://img.shields.io/badge/GDPR-Article%2017%20%2B%2020-1f6feb)](COMPLIANCE.md)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)

A production-grade multi-tenant SaaS for insurance companies, agents, and customers — with **ML-powered risk scoring**, **fraud detection**, and **content-based product recommendations**. Built as a Bachelor's thesis project demonstrating end-to-end software engineering: full-stack TypeScript, Python ML service, role-based access control, observability, real-money payments, file storage, GDPR compliance, bilingual UI, and CI/CD.

**🌐 Live deployment**: [insurance-saas-platform.vercel.app](https://insurance-saas-platform.vercel.app) • [API Swagger](https://backend-production-2cce.up.railway.app/api/docs) • [ML service](https://ml-service-production-6cbc.up.railway.app/health)

---

## ✨ Key Features

### For Customers
- Browse the full insurance product catalog and apply in one click
- Get instant ML-powered premium quotes with risk explanation
- See personalised product recommendations (TF-IDF + cosine similarity)
- Pay for policies via **Stripe Checkout** (real card processing), file claims, track status
- Upload supporting documents for claims (images + PDFs, stored on Cloudflare R2)
- **GDPR data export** (Article 20) and **account deletion** (Article 17) from the profile page
- Full bilingual UI — switch between English and Ukrainian on the fly

### For Agents
- Triage application queue with bulk approve/reject actions
- Inspect every prediction's **SHAP feature contributions** to understand *why* the model classified an application as risky
- Process claims with fraud-detection signals and explanations

### For Company Admins (Tenant Scoped)
- Live analytics dashboard: status pie charts, premium revenue trends
- **Business Intelligence** powered by ML: Top Risk Drivers, Top Fraud Drivers, Performance per Product (loss ratio, revenue rank)
- Create, edit, and archive products with safety guard against deleting active policies

### For Platform Admins
- Onboard new tenant companies, manage user accounts across all roles
- **ML Models methodology dashboard** — CV box-plots, ROC curves, confusion matrices, permutation importance — all served from the trained model metrics
- Compliance audit log of every meaningful action

---

## 🧠 Machine Learning

| Model | Algorithm | Validation | Production Metric |
|---|---|---|---|
| Risk Scoring | Gradient Boosting (winner via GridSearchCV vs LR / RF) | 5-fold StratifiedKFold | Test ROC-AUC **0.78** |
| Fraud Detection | Logistic Regression + TF-IDF (ablation study vs numeric-only) | 5-fold StratifiedKFold | Test ROC-AUC **0.91** |
| Recommendations | Content-based, TF-IDF + cosine similarity | demographic-profile match | tracked per profile bucket |

- **Per-prediction explanations** via [SHAP](https://shap.readthedocs.io/) — feature contributions stored alongside each `RiskAssessment` / `FraudAssessment` and rendered as horizontal bar charts in the UI
- **Permutation importance** (n_repeats=15) for global feature ranking
- Methodology and metrics documented in [`ml-service/ML_METHODOLOGY.md`](ml-service/ML_METHODOLOGY.md)

---

## 📚 Documentation

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — system overview, service responsibilities, request flow, deployment topology, security
- [`COMPLIANCE.md`](COMPLIANCE.md) — GDPR (Articles 15/17/20/32), EU data residency configuration, retention policy, cross-border transfer disclosure
- [`ERD.md`](ERD.md) — Mermaid entity-relationship diagram of all 14 Prisma models
- [`DEMO.md`](DEMO.md) — 3-minute demo script with timestamps and Q&A talking points
- [`ml-service/ML_METHODOLOGY.md`](ml-service/ML_METHODOLOGY.md) — full ML methodology write-up (CV, GridSearch, SHAP, permutation importance)

## 🏗 Architecture

```
┌──────────────┐    HTTPS    ┌──────────────┐   REST    ┌──────────────┐
│  Next.js 15  │ ──────────▶ │  NestJS API  │ ────────▶ │  ML Service  │
│  (frontend)  │             │  (backend)   │           │  (FastAPI)   │
└──────────────┘             └──────┬───────┘           └──────────────┘
                                    │
                                    ▼
                            ┌──────────────┐
                            │  PostgreSQL  │
                            │  + Prisma    │
                            └──────────────┘
```

**Frontend** — Next.js 16 App Router, Server Components, Tailwind, Recharts, Sonner toasts, Framer Motion, custom cookie-driven i18n provider (EN/UK), Playwright e2e tests. **Backend** — NestJS 11 with Prisma 5, JWT auth (HS256, 15-min access + 7-day refresh with rotation), bcrypt(10), Throttler, full audit log on 18+ event types, Stripe payments with webhook signature verification, async email via Resend (`setImmediate` + exponential-backoff retry), in-memory cache layer for hot read paths, GDPR Articles 17 + 20 endpoints. **ML** — FastAPI with lifespan model loader, scikit-learn pipelines, SHAP explainers, static plots, optional `X-Internal-API-Key` enforcement so only the backend can call inference endpoints. **Storage** — Cloudflare R2 (S3-compatible) for claim documents in production, local filesystem fallback for development. **Observability** — Sentry on both client and server, `nestjs-pino` structured logs with per-request `requestId`, split `/health/live` and `/health/ready` probes with DB + ML dependency checks. **API Docs** — auto-generated Swagger UI at `/api/docs`.

---

## 🚀 Quick Start

```bash
# 1. Clone and enter the repo
git clone https://github.com/alionuka/insurance-saas-platform.git
cd insurance-saas-platform

# 2. One-command boot — all 4 services
docker compose up -d

# 3. Seed demo data (3 companies, 20 users, 35 applications, 23 policies, 15 claims)
cd backend
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/insurance_saas_db?schema=public" \
  npx ts-node scripts/seed-demo.ts

# 4. Open the app
open http://localhost:3000
```

That's it. The full stack is now running:
- Frontend → http://localhost:3000
- Backend API → http://localhost:3001
- Swagger UI → http://localhost:3001/api/docs
- ML service → http://localhost:8000
- Postgres → localhost:5433

### Demo Credentials

All demo accounts share password `Password123!`. The sign-in page also has **one-click quick-login buttons** for every role.

| Role | Email |
|---|---|
| Customer | `alice.customer@example.com` |
| Agent | `emily.agent@example.com` |
| Company Admin | `sarah.admin@example.com` |
| Platform Admin | `admin@insurance-saas.com` |

---

## 🧪 Testing

```bash
# Backend: 72 e2e + unit tests (auth/RBAC, applications, claims, policies, payments, products)
cd backend
npm run test:e2e
npm run test                # unit tests (AuthService, PaymentsService)

# Frontend: 6 Playwright e2e specs (sign-in, customer-apply, profile, agent-workflow, admin-ml-dashboard)
cd frontend
npx playwright install      # one-time browser install
npm run test:e2e
```

Continuous integration runs on every push via GitHub Actions with a Postgres service container. Husky + lint-staged pre-commit hooks run ESLint on changed files only.

## 🌐 Internationalisation

The UI ships with full bilingual support: **English** (default) and **Ukrainian**. The locale switcher (🌐) sits in the header of every page; the choice is persisted to a cookie and read on the server during SSR so there is no English-flash on Ukrainian sessions. Translation infrastructure lives in `frontend/src/i18n/` — `messages.ts` (single source of truth for both locales), `getT.ts` (Server Components helper), `LocaleProvider.tsx` (client context + `useT()` hook), `LocaleSwitcher.tsx` (UI component).

Translated surfaces: landing page, all authentication flows (sign-in, sign-up, forgot/reset password), dashboard sidebar nav, profile page, dashboard overviews for all four roles, customer applications/policies/claims lists with status filter pills, quote calculator, recommendations, browse products, claim submission form. Detail pages and BI charts remain English — a pragmatic "selective i18n" approach common to B2B SaaS products.

## 🔒 Privacy & Compliance

GDPR Articles 17 (right to erasure) and 20 (data portability) are implemented end-to-end:

- **Export**: `GET /auth/me/export` → downloadable JSON dump of user profile, applications, policies, claims, payments, audit-log entries
- **Delete**: `DELETE /auth/me` → atomic transaction across 9 tables, requires password confirmation, anonymises audit-log actor references

EU data residency is achievable across all three hosting providers (Vercel `fra1`, Railway EU West, Cloudflare R2 EU jurisdiction). Full implementation notes, data inventory, retention policy, and auditor checklist in [`COMPLIANCE.md`](COMPLIANCE.md).

---

## 🎬 3-Minute Demo Flow

Suggested walkthrough order if recording a defence/demo video:

1. Landing page → Quick-login as **Customer (Alice)**
2. Dashboard overview (stats + recent activity) → **Browse Products** → Apply
3. Application detail → see **Risk Score + SHAP feature contributions chart**
4. File a claim → see **Fraud SHAP** in the agent's view
5. Quick-login as **Agent** → Applications queue with bulk approve → policy created
6. Quick-login as **Company Admin** → **BI dashboard** (Risk Distribution + Top Risk Drivers + Top Fraud Drivers + Performance per Product)
7. Quick-login as **Platform Admin** → **ML Models methodology** dashboard (ROC curves + Confusion Matrix + CV table + Permutation Importance)
8. `/api/docs` → live API documentation
9. Terminal: `docker compose ps` → "one command, full stack running"

---

## 🛠 Local Development (without Docker)

```bash
# Terminal 1 — Postgres only
docker compose up -d db

# Terminal 2 — ML service
cd ml-service && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 8000 --reload

# Terminal 3 — Backend
cd backend && npm install
npx prisma migrate deploy
npm run start:dev

# Terminal 4 — Frontend
cd frontend && npm install
npm run dev
```

---

## 📚 Project Stats

- **Backend**: ~4,500 lines of TypeScript across 14 Prisma models, 45+ REST endpoints, GDPR endpoints, Stripe payments, R2 file storage
- **Frontend**: ~13,500 lines of TypeScript/TSX, 4 role-aware dashboards, bilingual UI (EN/UK), 6 Playwright e2e specs
- **ML Service**: 2,000 lines of Python with 3 trained sklearn pipelines + SHAP explainers
- **Tests**: 72 backend e2e + 8 backend unit + 6 frontend Playwright; CI green on every push
- **Production deployment**: Vercel (frontend) + Railway (backend + ml-service + Postgres) + Cloudflare R2 (file storage) + Resend (email) + Stripe (payments) + Sentry (errors)
- **Container images**: 3 production-ready Dockerfiles + 1 docker-compose orchestration

---

## 🗄 Backup

```bash
./scripts/backup-db.sh
```

Dumps the running Postgres container to `./backups/insurance_saas_db_<UTC-timestamp>.sql`. See [`scripts/backup-db.sh`](scripts/backup-db.sh) for restore instructions.

---

## 📄 License

MIT — see [LICENSE](LICENSE).
