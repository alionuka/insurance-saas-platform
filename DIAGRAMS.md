# PlantUML діаграми для презентації InsurSaaS

Кожен блок коду нижче скопіюй у [plantuml.com](https://www.plantuml.com/plantuml/uml/)
або у будь-який інший PlantUML-редактор (Mermaid plugin, Visual Studio Code
PlantUML extension). Експортуй у PNG/SVG і встав у слайди презентації.

---

## 1️⃣ Діаграми використання — РОЗБИТІ НА 3 КОМПАКТНІ

> Завелика діаграма не читається. Розбила на 3 окремих — кожна на свій слайд.
> Стиль повторює приклад з PPTX (вебзастосунок vs CRM окремо).

### 1A. Діаграма використання — клієнтська частина

Покажи на слайді **6** (замість моїх bullet-списків). Customer + Guest разом.

```plantuml
@startuml InsurSaaS_Customer
left to right direction
skinparam packageStyle rectangle
skinparam shadowing false
skinparam nodesep 8
skinparam ranksep 18
skinparam ActorBackgroundColor #E0E7FF
skinparam ActorBorderColor #4F46E5
skinparam UsecaseBackgroundColor #F8FAFC
skinparam UsecaseBorderColor #64748B
skinparam ArrowColor #475569

actor "Неавторизований\nкористувач" as Guest
actor "Клієнт\n(Customer)" as Customer

Customer --|> Guest

rectangle "Клієнтська частина InsurSaaS" {
  usecase "Перегляд лендингу" as UC1
  usecase "Перегляд каталогу\nстрахових продуктів" as UC2
  usecase "Реєстрація" as UC3
  usecase "Автентифікація" as UC4
  usecase "Скидання паролю" as UC5
  usecase "Розрахунок тарифу\n(ML quote)" as UC6
  usecase "Подача заявки" as UC7
  usecase "Перегляд SHAP-\nпояснення оцінки" as UC8
  usecase "Оплата полісу\n(Stripe)" as UC9
  usecase "Подача виплати" as UC10
  usecase "Завантаження\nдокументів" as UC11
  usecase "Персональні ML-\nрекомендації" as UC12
  usecase "Редагування профілю\n+ фото" as UC13
  usecase "GDPR експорт даних" as UC14
  usecase "GDPR видалення\nакаунту" as UC15
}

Guest --> UC1
Guest --> UC2
Guest --> UC3
Guest --> UC4
Guest --> UC5

Customer --> UC6
Customer --> UC7
Customer --> UC8
Customer --> UC9
Customer --> UC10
Customer --> UC11
Customer --> UC12
Customer --> UC13
Customer --> UC14
Customer --> UC15

@enduml
```

---

### 1B. Діаграма використання — Agent + Company Admin

Покажи на слайді **7**. Два актори страхової компанії.

```plantuml
@startuml InsurSaaS_AgentCompany
left to right direction
skinparam packageStyle rectangle
skinparam shadowing false
skinparam nodesep 8
skinparam ranksep 18
skinparam ActorBackgroundColor #D1FAE5
skinparam ActorBorderColor #10B981
skinparam UsecaseBackgroundColor #F8FAFC
skinparam UsecaseBorderColor #64748B
skinparam ArrowColor #475569

actor "Страховий агент\n(Agent)" as Agent
actor "Адмін компанії\n(Company Admin)" as CompanyAdmin

rectangle "Робочий простір страхової компанії" {
  package "Agent" as AgentPkg {
    usecase "Огляд черги заявок\nз ML-скорами" as A1
    usecase "Approve / Reject\nзаявки" as A2
    usecase "Bulk-операції\nзаявок" as A3
    usecase "Огляд черги виплат" as A4
    usecase "Перегляд fraud-\nфлагів і SHAP" as A5
    usecase "Перегляд історії\nклієнтів" as A6
  }

  package "Company Admin" as CompPkg {
    usecase "BI-аналітика\nпортфеля у real-time" as C1
    usecase "Top Risk Drivers\n(агрегований SHAP)" as C2
    usecase "Top Fraud Drivers" as C3
    usecase "Product Performance\n+ Loss Ratio" as C4
    usecase "CRUD страхових\nпродуктів" as C5
    usecase "Перегляд полісів\nтенанту" as C6
    usecase "Налаштування\nбрендингу\n(logo + color)" as C7
  }
}

Agent --> A1
Agent --> A2
Agent --> A3
Agent --> A4
Agent --> A5
Agent --> A6

CompanyAdmin --> C1
CompanyAdmin --> C2
CompanyAdmin --> C3
CompanyAdmin --> C4
CompanyAdmin --> C5
CompanyAdmin --> C6
CompanyAdmin --> C7

@enduml
```

---

### 1C. Діаграма використання — Platform Admin

Покажи на новому слайді (вставляється після 7). Окремо адміністратор платформи — суперюзер.

```plantuml
@startuml InsurSaaS_PlatformAdmin
left to right direction
skinparam packageStyle rectangle
skinparam shadowing false
skinparam nodesep 8
skinparam ranksep 18
skinparam ActorBackgroundColor #FECACA
skinparam ActorBorderColor #DC2626
skinparam UsecaseBackgroundColor #F8FAFC
skinparam UsecaseBorderColor #64748B
skinparam ArrowColor #475569

actor "Адмін платформи\n(Platform Admin)" as PlatformAdmin

rectangle "Адміністрування платформи InsurSaaS" {
  usecase "KYC-черга нових\nкомпаній" as P1
  usecase "Approve / Suspend\nтенантів" as P2
  usecase "Управління\nкористувачами\nвсіх ролей" as P3
  usecase "Cross-tenant\nаналітика" as P4
  usecase "ML Models\nMethodology Dashboard" as P5
  usecase "Перегляд CV-результатів,\nROC, Permutation\nImportance" as P6
  usecase "Compliance audit log\n(full trail)" as P7
  usecase "Cross-platform\nпошук (⌘K)" as P8
}

PlatformAdmin --> P1
PlatformAdmin --> P2
PlatformAdmin --> P3
PlatformAdmin --> P4
PlatformAdmin --> P5
PlatformAdmin --> P6
PlatformAdmin --> P7
PlatformAdmin --> P8

@enduml
```

---

## 2️⃣ Діаграма класів моделей — РОЗБИТА НА 2 ЧАСТИНИ

> Одна велика діаграма з усіма 14 моделями виходить нечитабельною на слайді.
> Розбила за логічними доменами: **2A** — основний бізнес-флоу, **2B** — ML та інфраструктура.
> Скорочено до 4-6 ключових полів на клас, прибрано `createdAt` / optional fields, що в кожному класі.

---

### 2A. Бізнес-модель (Core domain)

Покажи на окремому слайді після Use Case. Це основний research artifact — продукт→заявка→поліс→виплата.

```plantuml
@startuml InsurSaaS_DataModel_Core
hide circle
hide empty methods
skinparam shadowing false
skinparam classBackgroundColor #F8FAFC
skinparam classBorderColor #4F46E5
skinparam ArrowColor #475569
skinparam classAttributeFontSize 10
skinparam classFontSize 12
skinparam classFontStyle bold
skinparam linetype ortho
skinparam nodesep 25
skinparam ranksep 35

title Доменна модель InsurSaaS — бізнес-флоу

' ─────────── Enums ───────────
enum UserRole {
  CUSTOMER
  AGENT
  COMPANY_ADMIN
  PLATFORM_ADMIN
}

enum ApplicationStatus {
  PENDING
  UNDER_REVIEW
  APPROVED
  REJECTED
}

enum PolicyStatus {
  PENDING_PAYMENT
  ACTIVE
  EXPIRED
  CANCELLED
}

enum ClaimStatus {
  FILED
  IN_PROGRESS
  APPROVED
  DENIED
}

enum PaymentStatus {
  PENDING
  SUCCEEDED
  FAILED
}

' ─────────── Classes (skinny) ───────────
class Company {
  +id <<PK>>
  +name
  +status: CompanyStatus
  +primaryColor
  +licenseNumber
}

class User {
  +id <<PK>>
  +email <<unique>>
  +role: UserRole
  +firstName
  +lastName
  +companyId <<FK>>
}

class InsuranceProduct {
  +id <<PK>>
  +companyId <<FK>>
  +name
  +type
  +basePremium
}

class Application {
  +id <<PK>>
  +userId <<FK>>
  +productId <<FK>>
  +status: ApplicationStatus
}

class Policy {
  +id <<PK>>
  +applicationId <<FK,unique>>
  +policyNumber <<unique>>
  +status: PolicyStatus
  +premiumAmount
  +startDate / endDate
}

class Claim {
  +id <<PK>>
  +policyId <<FK>>
  +amount
  +description
  +status: ClaimStatus
}

class Payment {
  +id <<PK>>
  +policyId <<FK>>
  +amount
  +status: PaymentStatus
  +stripeSessionId
}

' ─────────── Relations ───────────
Company "1" -- "0..*" User : employs >
Company "1" -- "0..*" InsuranceProduct : offers >
User "1" -- "0..*" Application : submits >
InsuranceProduct "1" -- "0..*" Application : referenced >
Application "1" -- "0..1" Policy : becomes >
Policy "1" -- "0..*" Payment : invoiced >
Policy "1" -- "0..*" Claim : claimed >

User ..> UserRole
Application ..> ApplicationStatus
Policy ..> PolicyStatus
Claim ..> ClaimStatus
Payment ..> PaymentStatus

@enduml
```

---

### 2B. ML, документи, авторизація, аудит

Покажи на окремому слайді одразу після 2A. Це «сателіти» навколо ядра — ML-оцінки, документи, токени, лог.

```plantuml
@startuml InsurSaaS_DataModel_Support
hide circle
hide empty methods
skinparam shadowing false
skinparam classBackgroundColor #F8FAFC
skinparam classBorderColor #10B981
skinparam ArrowColor #475569
skinparam classAttributeFontSize 10
skinparam classFontSize 12
skinparam classFontStyle bold
skinparam linetype ortho
skinparam nodesep 25
skinparam ranksep 35

title ML, документи, авторизація та аудит

' ─────────── Enums ───────────
enum RiskLevel {
  LOW
  MEDIUM
  HIGH
}

enum FraudFlag {
  NORMAL
  SUSPICIOUS
}

' ─────────── External anchors (referenced from Core) ───────────
class Application <<external>> {
  +id <<PK>>
}

class Claim <<external>> {
  +id <<PK>>
}

class User <<external>> {
  +id <<PK>>
}

' ─────────── ML assessments ───────────
class RiskAssessment {
  +id <<PK>>
  +applicationId <<FK,unique>>
  +riskScore
  +riskLevel: RiskLevel
  +featureContributions: Json
}

class FraudAssessment {
  +id <<PK>>
  +claimId <<FK,unique>>
  +fraudScore
  +flag: FraudFlag
  +featureContributions: Json
}

class Recommendation {
  +id <<PK>>
  +userId <<FK>>
  +productId <<FK>>
  +score
}

' ─────────── Documents + Auth + Audit ───────────
class ClaimDocument {
  +id <<PK>>
  +claimId <<FK>>
  +filename
  +url
  +mimeType
  +sizeBytes
}

class RefreshToken {
  +id <<PK>>
  +userId <<FK>>
  +tokenHash
  +expiresAt
  +revokedAt?
}

class PasswordResetToken {
  +id <<PK>>
  +userId <<FK>>
  +token <<unique>>
  +expiresAt
  +used
}

class AuditLog {
  +id <<PK>>
  +action
  +actorId?
  +resourceType
  +resourceId?
  +metadata: Json
}

' ─────────── Relations ───────────
Application "1" -- "0..1" RiskAssessment : has ML score
Claim "1" -- "0..1" FraudAssessment : has fraud check
Claim "1" -- "0..*" ClaimDocument : supported by >
User "1" -- "0..*" Recommendation : receives >
User "1" -- "0..*" RefreshToken : has >
User "1" -- "0..*" PasswordResetToken : has >

RiskAssessment ..> RiskLevel
FraudAssessment ..> FraudFlag

@enduml
```

> Класи `Application`, `Claim`, `User` показані як «зовнішні якорі» (`<<external>>`) — їхні деталі вже на діаграмі 2A. Тут вони лише для зв'язків.

---

## 3️⃣ Архітектура системи (Component Diagram)

```plantuml
@startuml InsurSaaS_Architecture
skinparam shadowing false
skinparam componentStyle uml2
skinparam ArrowColor #475569

skinparam package {
  BackgroundColor<<Frontend>>     #E0E7FF
  BorderColor<<Frontend>>         #4F46E5
  BackgroundColor<<Backend>>      #D1FAE5
  BorderColor<<Backend>>          #10B981
  BackgroundColor<<ML>>           #FEF3C7
  BorderColor<<ML>>               #F59E0B
  BackgroundColor<<DB>>           #E2E8F0
  BorderColor<<DB>>               #475569
  BackgroundColor<<External>>     #FCE7F3
  BorderColor<<External>>         #EC4899
}

title Архітектура InsurSaaS — production deployment

actor "Користувач" as User

package "Vercel (EU edge)" <<Frontend>> {
  component "Next.js 16\nApp Router" as NextApp
  component "Server\nComponents" as RSC
  component "Client\nComponents" as Client
  NextApp --> RSC
  NextApp --> Client
}

package "Railway (EU West)" <<Backend>> {
  component "NestJS 11\nREST API" as Nest
  component "Auth\n(JWT + bcrypt)" as Auth
  component "Throttler" as Throttler
  component "Audit Log" as Audit
  component "Prisma 5\nORM" as Prisma
  Nest --> Auth
  Nest --> Throttler
  Nest --> Audit
  Nest --> Prisma
}

package "Railway (EU West)" <<ML>> {
  component "FastAPI" as FastAPI
  component "Gradient Boosting\n(Risk)" as ModelRisk
  component "LR + TF-IDF\n(Fraud)" as ModelFraud
  component "Content-based\n(Recommendations)" as ModelRecs
  component "SHAP\nExplainer" as SHAP
  FastAPI --> ModelRisk
  FastAPI --> ModelFraud
  FastAPI --> ModelRecs
  ModelRisk --> SHAP
  ModelFraud --> SHAP
}

database "PostgreSQL 15\n(Railway EU)" <<DB>> as Postgres

cloud "Cloudflare R2\n(EU jurisdiction)" <<External>> as R2
cloud "Stripe\n(Test Mode)" <<External>> as Stripe
cloud "Resend SMTP\n(EU region)" <<External>> as Resend
cloud "Sentry\n(de.sentry.io)" <<External>> as Sentry

' ─────────── Flows ───────────
User -down-> NextApp : HTTPS
RSC -right-> Nest : fetch /api/* (cookies)
Client -right-> Nest : fetch /api/* (Bearer)

Nest -down-> FastAPI : POST /risk/predict\nPOST /fraud/detect\n(X-Internal-API-Key)
Prisma -down-> Postgres : SQL (TLS)

Nest -down-> R2 : S3 API\n(claim documents,\ncompany logos)
Nest -down-> Stripe : Checkout sessions\n+ webhooks (signed)
Nest -down-> Resend : SMTP\n(transactional email)
Nest --> Sentry : error reporting
NextApp --> Sentry : client errors

note bottom of Postgres
  Multi-tenant isolation
  via companyId filtering
  at service layer
end note

note bottom of R2
  EU jurisdiction —
  GDPR data residency
end note

note bottom of Stripe
  Test Mode для дипломки.
  Switch to Live = env var swap.
end note

@enduml
```

---

## 4️⃣ Bonus — Sequence: подача виплати з SHAP fraud check

Якщо хочеш показати конкретний flow:

```plantuml
@startuml InsurSaaS_ClaimFlow
skinparam shadowing false
skinparam sequenceArrowColor #475569

title Sequence: подача виплати клієнтом

actor Customer
participant "Next.js\n(Frontend)" as Front
participant "NestJS\n(Backend)" as Back
participant "ClaimsService" as ClaimsSvc
participant "MlClient" as MlClient
participant "FastAPI\n(ML)" as ML
database "PostgreSQL" as DB
participant "Resend" as Email

Customer -> Front : Заповнює форму\n(POST /claims)
Front -> Back : POST /claims\n(Bearer JWT)
Back -> ClaimsSvc : create(dto, userId)
ClaimsSvc -> DB : SELECT policy, application
note right: Перевірка ownership\n+ ACTIVE статусу
ClaimsSvc -> MlClient : detectFraud(claimId, amount, type, description)
MlClient -> ML : POST /fraud/detect\n+ X-Internal-API-Key
ML -> ML : LR+TFIDF predict\n+ SHAP feature contributions
ML --> MlClient : { fraudScore, flag, explanation,\n  featureContributions }
MlClient --> ClaimsSvc : FraudResponseDto
ClaimsSvc -> DB : BEGIN TRANSACTION
ClaimsSvc -> DB : INSERT Claim
ClaimsSvc -> DB : INSERT FraudAssessment
ClaimsSvc -> DB : COMMIT (15s timeout)
ClaimsSvc -> Email : sendClaimFiled(...)
note right: async via setImmediate\n+ exponential backoff retry
ClaimsSvc -> DB : INSERT AuditLog
ClaimsSvc --> Back : Claim with FraudAssessment
Back --> Front : 201 Created + JSON
Front --> Customer : Toast "Claim submitted"\n+ redirect to detail

@enduml
```

---

## Як використати

1. Зайди на https://www.plantuml.com/plantuml/uml/
2. Стерти весь приклад у текстовому полі
3. Вставити один з блоків коду вище (без \`\`\`plantuml \`\`\`)
4. Згенерується картинка → завантаж як PNG або SVG
5. Встав у відповідний слайд презентації

**Або** — встанови VS Code extension "PlantUML" і генеруй прямо у редакторі.

**Або** — у GitHub README.md PlantUML рендериться через [Kroki](https://kroki.io/) або просто вставив `@startuml ... @enduml` блок як зображення через сервіс типу [plantuml-encoder](https://www.npmjs.com/package/plantuml-encoder).

---

**Поради:**
- Use case діаграма (#1) дуже широка — можеш розділити на 2 діаграми (Customer+Agent окремо від CompanyAdmin+PlatformAdmin) для презентації.
- Class diagram (#2) — основний "research artifact" для бакалаврського захисту. Покажи на окремому слайді.
- Architecture (#3) — заміни на слайд 8 у презентації.
- Sequence (#4) — бонус, опціонально для додаткового слайду після ML методології.
