# Database Schema (ERD)

Entity-Relationship Diagram for the InsurSaaS platform. Source of truth: [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma).

```mermaid
erDiagram
    Company ||--o{ InsuranceProduct : "offers"
    Company ||--o{ User : "employs (admins)"

    User ||--o{ Application : "submits"
    User ||--o{ Claim : "files"
    User ||--o{ Policy : "owns"
    User ||--o{ Payment : "makes"
    User ||--o{ AuditLog : "performs"
    User ||--o{ Recommendation : "receives"
    User ||--o{ PasswordResetToken : "requests"
    User ||--o{ RefreshToken : "holds"
    User ||--o{ ClaimDocument : "uploads"

    InsuranceProduct ||--o{ Application : "applied for"
    InsuranceProduct ||--o{ Policy : "issued as"

    Application ||--o| RiskAssessment : "scored by"
    Application ||--o| Policy : "results in"
    Application ||--o{ Claim : "filed against"

    Policy ||--o{ Claim : "covers"
    Policy ||--o{ Payment : "paid for"

    Claim ||--o| FraudAssessment : "checked by"
    Claim ||--o{ ClaimDocument : "supported by"

    User {
        string id PK
        string email UK
        string passwordHash
        UserRole role
        string firstName
        string lastName
        int age
        float annualIncome
        int creditScore
        string companyId FK "nullable"
    }

    Company {
        string id PK
        string name
        string description
    }

    InsuranceProduct {
        string id PK
        string name
        ProductType type
        string description
        float basePremium
        string companyId FK
    }

    Application {
        string id PK
        string userId FK
        string productId FK
        ApplicationStatus status
    }

    RiskAssessment {
        string id PK
        string applicationId FK
        float riskScore
        RiskLevel riskLevel
        string explanation
        Json featureContributions "SHAP values"
    }

    Policy {
        string id PK
        string userId FK
        string applicationId FK
        string productId FK
        string policyNumber UK
        PolicyStatus status
        float premiumAmount
        datetime startDate
        datetime endDate
    }

    Claim {
        string id PK
        string userId FK
        string applicationId FK
        string policyId FK
        float amount
        string description
        ClaimStatus status
    }

    FraudAssessment {
        string id PK
        string claimId FK
        float fraudScore
        FraudFlag flag
        string explanation
        Json featureContributions "SHAP values"
    }

    ClaimDocument {
        string id PK
        string claimId FK
        string uploadedById FK
        string filename
        string mimeType
        int sizeBytes
        string url
    }

    Payment {
        string id PK
        string policyId FK
        string userId FK
        float amount
        PaymentStatus status
        string stripeSessionId
        string stripePaymentId
    }

    Recommendation {
        string id PK
        string userId FK
        string productIds "Json array"
        string explanation
    }

    AuditLog {
        string id PK
        string actorId FK "nullable"
        string actorEmail
        string actorRole
        string action
        string resourceType
        string resourceId
        Json metadata
        string ipAddress
    }

    PasswordResetToken {
        string id PK
        string userId FK
        string tokenHash UK
        datetime expiresAt
        datetime usedAt "nullable"
    }

    RefreshToken {
        string id PK
        string userId FK
        string tokenHash UK
        datetime expiresAt
        datetime revokedAt "nullable"
    }
```

## Key design decisions

- **`User.companyId` is nullable** — customers, agents, and platform admins have no company; only company admins are tenant-bound.
- **`Application` 1→0..1 `RiskAssessment`** — every application that successfully calls the ML service gets exactly one risk assessment. The 0..1 covers the case where ML service is unreachable (graceful degradation).
- **`Claim` 1→0..1 `FraudAssessment`** — same pattern as risk.
- **`featureContributions` JSONB** — SHAP values stored as `[{feature, value, contribution}]` to keep the relational schema flexible if we change features.
- **Refresh tokens are hashed** — `RefreshToken.tokenHash` is bcrypt-hashed before storage so a DB leak cannot impersonate users.
- **Cascading deletes** are configured where ownership semantics require it (e.g., deleting a User cascades to their refresh tokens but NOT to their applications, which become "orphaned" historical records preserved for audit purposes).

## Tenant scoping

Multi-tenant isolation happens at the **service layer**, not in Prisma:
- `COMPANY_ADMIN.companyId` is set at registration
- Queries that should be tenant-scoped include `where: { product: { companyId: user.companyId } }`
- `PLATFORM_ADMIN` queries omit the company filter
- `CUSTOMER` and `AGENT` queries use ownership filters (`userId === user.id` for customers, no filter for agents)
