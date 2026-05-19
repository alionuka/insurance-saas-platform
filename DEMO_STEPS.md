# Demo Steps — буквально що клікати

> Поставь Vercel env `NEXT_PUBLIC_DEMO_MODE=true` ПЕРЕД записом
> (щоб були quick-login кнопки). Після запису — `false`.

> Перед записом виконай для прогріву:
> ```
> curl -s https://backend-production-2cce.up.railway.app/health/ready
> curl -s https://ml-service-production-6cbc.up.railway.app/health
> ```

---

## 🎬 30 кроків. ~4:30 хв.

### Сцена 1: Landing + мова (0:00–0:20)

**1.** Відкрий `https://insurance-saas-platform.vercel.app`
**💬** *"InsurSaaS — multi-tenant insurance SaaS з ML. Розгорнуто на Vercel + Railway."*

**2.** Клікни 🌐 **EN** у правому верхньому куті → стає **UK** (все українською)
**💬** *"Bilingual UI — українська та англійська."*

**3.** Клікни 🌐 знову (поверни EN) — щоб voiceover був зрозумілий далі

---

### Сцена 2: Customer + ML SHAP (0:20–1:25)

**4.** Скрольни до "Available Insurance Products" → клікни синю кнопку **"Apply Now"** на будь-якому продукті (потрапиш на sign-in)
**💬** *"Customer-flow починається."*

**5.** Клікни кнопку **"Customer"** (синя, quick-login)
**💬** *"Логін як клієнт Alice."*

**6.** На дашборді клікни sidebar **"Browse Products"**

**7.** На будь-якому HEALTH-продукті клікни зелену **"Apply for this Product"**
**💬** *"Один клік — заявка, бекенд викликає ML для скорингу ризику."*

**8.** Чекай ~2 сек — відкриється Application detail. Скрольни вниз до **"Risk Assessment"** з графіком
**💬** *"Ось ключовий диференціатор — SHAP per-prediction explainability. Модель показує що credit score — найвагоміший фактор. Це збережено у БД разом з оцінкою."*

**9.** Sidebar клікни **"Claims"**

**10.** У формі **"File a New Claim"**:
   - Select policy: будь-який ACTIVE
   - Amount: `1500`
   - Description: `Vehicle collision — front bumper damage`
   - Клікни **"Submit Claim"**

**11.** Чекай ~3 сек поки виплата з'явиться у списку → клікни на неї щоб розкрити
**💬** *"Fraud score, прапор, текстове пояснення — все згенеровано логістичною регресією з TF-IDF на тексті опису."*

---

### Сцена 3: Self-service onboarding (1:25–2:15)

**12.** Sidebar → клікни на іконку **користувача внизу** → з'явиться меню → **Sign Out**
АБО: натисни LogOut іконку поряд з аватаром внизу sidebar
**💬** *"Тепер показую найважливіше для SaaS — self-service company onboarding."*

**13.** На sign-in сторінці клікни помаранчевий лінк **"Onboard your company →"**

**14.** Заповни форму швидко:
   - Company name: `Demo Insurance Corp`
   - License: `UA-INS-001`
   - Country: `UA`
   - Phone: `+380441234567`
   - First name: `Test`
   - Last name: `Admin`
   - Email: `demo-admin@example.com`
   - Password: `Password123!`
   - Клікни **"Create company account"**

**💬** (поки заповнюєш) *"Форма захоплює KYC-індикатори — license number, country, compliance phone. У продакшні це б валідувалось через ComplyAdvantage. Тут — admin approval workflow."*

**15.** Перенаправляє на success-сторінку з 3-step pending tracker
**💬** *"Компанія створена зі статусом PENDING_VERIFICATION. Не може створювати продукти поки platform admin не підтвердить."*

---

### Сцена 4: Platform admin approval (2:15–2:55)

**16.** Клікни **"Back to sign in"** або іди на `/auth/sign-in`

**17.** Клікни фіолетову кнопку **"Platform"** (quick-login PLATFORM_ADMIN)

**18.** Sidebar клікни **"Companies"**

**19.** Бачиш жовту секцію **"Pending Verification"** з "Demo Insurance Corp"
**💬** *"Admin бачить чергу на верифікацію з KYC-полями."*

**20.** Клікни зелену кнопку **"Approve"** праворуч від Demo Insurance Corp
**💬** *"Один клік — статус ACTIVE, audit-log зберігає хто підтвердив."*

**21.** Sidebar → клікни **"ML Models"** → клікни вкладку **"Risk Prediction"** → скрольни до Cross-Validation
**💬** *"ML методологія: Gradient Boosting через 5-fold cross-validated GridSearch проти LR і RF. ROC-AUC 0.78. Permutation Importance показує що credit score лідирує."*

---

### Сцена 5: Branding (2:55–3:35)

**22.** Sign Out → Sign In → quick-login **"Co. Admin"** (amber кнопка)
**💬** *"Тепер показую per-tenant branding — white-label SaaS feature."*

**23.** Sidebar клікни **"Settings"** (іконка палітри)

**24.** У формі **"Tenant Branding"**:
   - Клікни на color picker → вибери червоний (#ef4444 або подібний контрастний)
   - Клікни **"Save branding"**

**💬** *"Зміни одразу видимі customer'ам — продукт-картки беруть колір тенанта."*

**25.** Відкрий нову вкладку → `/dashboard/client/products` (вже залогінена як sarah — тому продукти Acme з новим кольором)
АБО просто sign out + login as Customer + Browse Products

**💬** *"Customer тепер бачить продукти у брендингу компанії."*

---

### Сцена 6: GDPR (3:35–3:55)

**26.** Sidebar → **"Profile"** → скрольни до **"Data Rights"** / **"Права на дані"**
**💬** *"GDPR Article 17 і 20 — export data як JSON та delete account з підтвердженням паролю."*

**27.** Клікни **"Export my data"** → завантажиться файл
**💬** *"Завантажується JSON dump усіх своїх даних."*

---

### Сцена 7: Evidence (3:55–4:30)

**28.** Переключи на готову вкладку **Sentry** (`https://alona-y6.sentry.io/projects/insursaas-backend/`)
**💬** *"Production observability. Sentry зловив реальну Prisma transaction timeout помилку у проді — ми задіагностували і виправили."*

**29.** Переключи на готову вкладку **Swagger** (`/api/docs`)
**💬** *"Auto-generated API docs — 45+ endpoints."*

**30.** Переключи на **Lighthouse screenshot** з 99/96/96/100
**💬** *"Lighthouse mobile — 99 Performance, 96 Accessibility, 96 Best Practices, 100 SEO. Production URL. Дякую за увагу."*

---

## ⚠️ Якщо щось пішло не так під час запису

| Проблема | Що робити |
|---|---|
| Cold-start API повільний | Зачекай 5 сек, голос за кадром "невелика затримка через cold-start Railway" |
| Виплата не з'являється | Refresh сторінки — payment processing async |
| Stripe checkout — TEST банер | Скажи "Stripe Test Mode — for safety reasons we don't use Live keys in thesis demo" |
| Не пам'ятаєш як sign out | Аватар внизу sidebar → іконка logout |
| Якщо щось зовсім ламається | Перейди до наступної сцени, скажи "switch to next view" |

---

## ✅ Перед фінальним записом

- [ ] Прогрів через curl (вище)
- [ ] Чотири вкладки відкриті заздалегідь: prod app + Sentry + Swagger + Lighthouse screenshot
- [ ] Інкогніто Chrome
- [ ] Loom або Cmd+Shift+5
- [ ] Перший прохід "сухий" (без запису) — записати скільки часу займає
- [ ] Тільки потім фінальний запис

**Удачі! У тебе вже все є — це лише записати.**
