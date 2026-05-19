# Demo Video — 4-5 хвилин для захисту

> Сценарій з покроковими діями + фразами для voiceover. Часові мітки в `[mm:ss]`.
> Записуй у Chrome **в інкогніто** на 1920×1080 (Cmd+Shift+5 для macOS recorder, або Loom).

---

## ⏳ Pre-record checklist (5 хв до запису)

```bash
# 1. Прогрів сервісів — щоб не було cold-start затримок під час запису
curl -s https://backend-production-2cce.up.railway.app/health/ready
curl -s https://ml-service-production-6cbc.up.railway.app/health
curl -s https://insurance-saas-platform.vercel.app | head -1

# 2. На Vercel переконайся що NEXT_PUBLIC_DEMO_MODE або відсутня, або =false
#    (інакше quick-login кнопки покажуться — а ми хочемо показати справжній sign-in)
# Для запису демо краще ВВІМКНУТИ DEMO_MODE — щоб не вводити паролі руками.
# Постав значення `true` тимчасово, після запису — прибери.
```

**Відкрий 5 вкладок у браузері заздалегідь** (щоб не шукати під час запису):
1. `https://insurance-saas-platform.vercel.app/` — головна
2. `https://insurance-saas-platform.vercel.app/auth/register-company` — onboarding
3. `https://backend-production-2cce.up.railway.app/api/docs` — Swagger
4. `https://alona-y6.sentry.io/projects/insursaas-backend/` — Sentry dashboard (логін заздалегідь)
5. Vercel Lighthouse скрін у Preview app — або PDF з оцінками 99/96/96/100

---

## 🎬 Сценарій з voiceover

### [0:00–0:25] Landing + i18n (25 сек)

**Дія:** Відкрий `https://insurance-saas-platform.vercel.app/` — повна landing-сторінка.

**Voiceover (українською):**
> *"Це InsurSaaS — мультитенантна страхова SaaS-платформа з ML-моделями для скорингу ризиків та виявлення шахрайства. Розгорнута у проді на Vercel, Railway і Cloudflare R2. Підтримує дві мови."*

**Дія:** Натисни 🌐 EN → перемикнути на UK у правому верхньому куті.

**Voiceover:**
> *"Перемикач мови — інтерфейс одразу українською. Серверні компоненти ререндеряться без перезавантаження сторінки."*

---

### [0:25–1:00] Customer flow — Apply + SHAP risk (35 сек)

**Дія:** Скрольни до "Available Insurance Products" → клік на Sign In → quick-login **Customer** (Alice).

**Voiceover:**
> *"Заходжу як клієнт. Кастомер бачить дашборд із заявками, полісами, виплатами."*

**Дія:** Sidebar → **Browse Products** → знайди продукт з типом HEALTH → клік "Apply".

**Voiceover:**
> *"Кастомер обирає продукт — у бекенді створюється заявка, викликається ML-сервіс для оцінки ризику."*

**Дія:** Чекай ~2 сек поки відкриється Application detail → скрольни до **Risk Assessment** + **Feature Contributions Chart**.

**Voiceover:**
> *"Ось ключовий диференціатор — SHAP-пояснення прогнозу. Не чорна скриня: модель показує, що кредитний рейтинг є найвагомішим фактором, плюс попередні заявки і вік. Це per-prediction explainability, збережена прямо у БД разом із самою оцінкою."*

---

### [1:00–1:35] File claim + SHAP fraud (35 сек)

**Дія:** Sidebar → **Claims** → File a New Claim → вибери активний поліс → Amount: `1500` → Description: `Vehicle collision at intersection — front bumper damage` → Submit.

**Voiceover:**
> *"Подаю виплату — на бекенді ML-сервіс розраховує fraud-score за допомогою логістичної регресії з TF-IDF текстових ознак."*

**Дія:** Чекай поки виплата з'явиться у списку → розкрий її → покажи **Fraud Score**, **Fraud Flag** та **ML Assessment** explanation.

**Voiceover:**
> *"Fraud Score, прапор, текстове пояснення моделі — все згенеровано автоматично. Якщо flag = SUSPICIOUS, агенту покажеться попередження."*

---

### [1:35–2:10] Self-service tenant onboarding + KYC (35 сек) ⭐

**Дія:** Sign Out → відкрий `/auth/register-company` (або клік "Onboard your company" link зі sign-in).

**Voiceover:**
> *"Тепер найважливіше для multi-tenant SaaS — self-service onboarding страхової компанії. Форма з двома секціями: Company information з KYC-індикаторами — license number, country, compliance phone — і Primary administrator."*

**Дія:** Заповни швидко:
- Company name: `Demo Insurance Corp`
- License: `UA-INS-DEMO`
- Country: `UA`
- Phone: `+380441234567`
- Admin name: `Test Admin`
- Email: `demo-admin@example.com`
- Password: `Password123!`

Submit → перенаправляє на success page з 3-step pending tracker.

**Voiceover:**
> *"Реєстрація створює Company + COMPANY_ADMIN атомарно в одній транзакції зі статусом PENDING_VERIFICATION. У продакшні цей етап інтегрується з compliance-провайдерами типу ComplyAdvantage. Тут — admin approval flow."*

---

### [2:10–2:45] Platform Admin approval + ML methodology (35 сек)

**Дія:** Sign In → quick-login **Platform** (admin@insurance-saas.com).

**Дія:** Sidebar → **Companies** → знайти "Demo Insurance Corp" у секції **Pending Verification** (amber-бордюр).

**Voiceover:**
> *"Platform admin бачить чергу на верифікацію — KYC-поля які подала компанія, з кнопкою Approve."*

**Дія:** Клік **Approve** → toast "Approved Demo Insurance Corp" → row переміщується у "Active Tenants".

**Voiceover:**
> *"Один клік — статус міняється на ACTIVE, audit-log зберігає хто і коли підтвердив. Тепер відкриваю ML Models dashboard..."*

**Дія:** Sidebar → **ML Models** → вкладка **Risk Prediction** → покажи **Cross-Validation results** + **Permutation Importance** chart.

**Voiceover:**
> *"Це сторінка ML-методології. Gradient Boosting обрано через 5-fold cross-validated GridSearch проти Logistic Regression і Random Forest. ROC-AUC 0.78. Permutation importance видно тут — credit score лідирує, як і очікувано."*

---

### [2:45–3:15] Company Admin + branding (30 сек)

**Дія:** Sign Out → quick-login **Co. Admin** (sarah.admin@example.com).

**Voiceover:**
> *"Company-admin бачить свою компанію в ізольованому view — лише її продукти, поліси, виплати, відфільтровані по companyId."*

**Дія:** Sidebar → **Settings** / **Налаштування**.

**Voiceover:**
> *"Per-tenant branding — компанія може завантажити свій логотип і обрати primary color. White-label SaaS feature."*

**Дія:** Зміни color picker на щось контрастне (наприклад #ef4444 червоний) → Save → Switch to **Customer** в інкогніто → Browse Products → бачимо що у цієї компанії продукти тепер з червоним бордюром і CTA-кнопками.

**Voiceover:**
> *"Зміна одразу видима кастомерам — продукт-картки беруть колір тенанта."*

---

### [3:15–3:50] Company BI dashboard (35 сек)

**Дія:** Назад у Company-admin → дашборд `/dashboard/company` → скрольни до **Business Intelligence**.

**Voiceover:**
> *"BI-секція — Risk Level Distribution, Top Risk Drivers агреговані через SHAP по всьому портфелю компанії, Top Fraud Drivers, Product Performance з loss ratio. Все ізольовано до цього тенанта."*

**Дія:** Покажи кілька графіків. Виділ що це **aggregated SHAP**, не просто counts.

---

### [3:50–4:20] GDPR + Profile (30 сек)

**Дія:** Sign In → quick-login **Customer** (Alice) → Sidebar → **Profile** → скрольни до **Data Rights** / **Права на дані**.

**Voiceover:**
> *"GDPR Articles 17 і 20. Customer бачить кнопки 'Export my data' — JSON dump усіх своїх даних, і 'Delete account' — атомарне видалення з підтвердженням паролю. Записано в audit-log, відповідає Article 17."*

**Дія:** Клік **Export** → завантажиться JSON-файл. (Можеш швидко відкрити у новій вкладці.)

---

### [4:20–4:50] Observability + Docs (30 сек)

**Дія:** Відкрий заздалегідь готову вкладку Sentry → дашборд `insursaas-backend` → покажи реальну зловлену помилку **PrismaClientKnownRequestError**.

**Voiceover:**
> *"Production observability через Sentry — це не теоретично. Бекенд зловив реальну помилку Prisma transaction timeout у POST /claims у проді, ми її задіагностували і виправили — підняли timeout для уникнення pool wait race condition. Sentry-проект у EU регіоні."*

**Дія:** Переключи на вкладку Swagger `/api/docs`.

**Voiceover:**
> *"API auto-documented через Swagger — 45+ ендпоінтів, всі DTO, Bearer auth — згенеровано з NestJS-декораторів."*

**Дія:** Переключи на вкладку Lighthouse-скріном **99 / 96 / 96 / 100**.

**Voiceover:**
> *"Lighthouse mobile audit — 99 Performance, 96 Accessibility, 96 Best Practices, 100 SEO. Це у проді на справжньому URL."*

---

### [4:50–5:00] Wrap (10 сек)

**Дія:** Назад на landing або dashboard.

**Voiceover:**
> *"Multi-tenant SaaS з ML-диференціатором, GDPR-готовністю, self-service onboarding і реальним production моніторингом. Дякую за увагу."*

---

## 💬 Анти-question prep (топ-10 ймовірних)

| Питання | Відповідь (одне речення) |
|---|---|
| "Чим це відрізняється від існуючих рішень?" | SHAP per-prediction explainability у проді — більшість insurance SaaS трактують ML як чорну скриню. |
| "Як ви забезпечуєте multi-tenant isolation?" | Сервіс-layer фільтрація по companyId для COMPANY_ADMIN; покрито e2e тестами. |
| "Звідки дата для тренування ML?" | Synthetic dataset з відомою ground truth, генератор у репозиторії, seed=42 для reproducibility. |
| "Це справді SaaS, чи прототип?" | Production deployment з Stripe, R2, Sentry, GDPR. Self-service onboarding з KYC-pending → admin approval. |
| "А реальні страхові не можуть просто так зареєструватись?" | Свідомо — KYC-валідація через ComplyAdvantage/Onfido поза scope, але форма ловить індикатори і workflow має admin-gate. |
| "Чому Stripe Test Mode?" | Test Mode безпечно демонструє повний integration без реальних грошей. Switch на Live — одна env-змінна. |
| "Чому Lighthouse тільки на landing?" | Inner-сторінки гірші через ML-fetch + chart-and. Landing — публічна, оптимізована для acquisition. |
| "Як це масштабується?" | Connection pooling Prisma, in-memory cache для catalog, async email через setImmediate, ML-сервіс stateless. |
| "GDPR compliance?" | Articles 17, 20, 32 — endpoints + cascading delete + bcrypt + Stripe SCC. EU residency через провайдери. |
| "Тести?" | 10/10 backend unit, 72+ e2e, 6/6 Playwright frontend, CI gating на кожен push. |

---

## 📸 Скріншоти-чітшит (зберегти на робочий стіл, на випадок прод-падіння)

1. Lighthouse 99/96/96/100 — `lighthouse-scores.png`
2. Sentry з помилкою PrismaClientKnownRequestError — `sentry-real-bug.png`
3. SHAP feature contributions chart — `shap-explanation.png`
4. Pending Verification queue з KYC fields — `tenant-approval.png`
5. Branded product cards customer view — `tenant-branding.png`
6. BI dashboard з Top Risk/Fraud Drivers — `bi-dashboard.png`
7. Swagger API docs — `swagger-api.png`
8. Сама ця сторінка під час демо — як бекап на випадок прод падіння

---

## 🔥 Tips для запису

- **Не поспішай** — між дiями роби паузи 1-2 сек щоб глядач встиг побачити що відбувається
- **Озвучуй короткими реченнями** — легше переробити якщо ляп
- **Якщо ML-сервіс холодний** — перший Apply може зайняти 10+ сек, **передзапусти** через curl
- **Тестовий запис** — обов'язково один прохід "сухий" перед фінальним
- **Subtitles** опціонально, але добре виглядає — використай Loom auto-captions якщо запис там
- **End screen** з URL + контактом — добре виглядає на захисті

---

**Готова. Записуй впевнено — у тебе **достатньо матеріалу на 4-5 хв сильної демонстрації**.**
