// Centralised UI strings for the two supported locales.
//
// Selective i18n: only the high-visibility surfaces (landing, auth, sidebar,
// profile, role overviews, common buttons) are translated. Inner pages
// (claims/policies/applications detail) remain English.

export type Locale = 'en' | 'uk';

export const LOCALES: Locale[] = ['en', 'uk'];

type LocaleMessages = {
  common: {
    signIn: string;
    signOut: string;
    signUp: string;
    save: string;
    cancel: string;
    loading: string;
    submitting: string;
    error: string;
    success: string;
    confirm: string;
    delete: string;
    edit: string;
    back: string;
    next: string;
    search: string;
    noData: string;
    language: string;
  };
  landing: {
    badge: string;
    heroLine1: string;
    heroBrand: string;
    heroSubtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    productsHeading: string;
    productsSubtitle: string;
    applyNow: string;
    fromPrice: string;
    contactForPricing: string;
    noDescription: string;
    errorLoad: string;
  };
  auth: {
    signInTitle: string;
    signInSubtitle: string;
    signUpTitle: string;
    signUpSubtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    forgotPassword: string;
    signInButton: string;
    quickDemoDivider: string;
    quickDemoHint: string;
    demoCustomer: string;
    demoAgent: string;
    demoCompanyAdmin: string;
    demoPlatform: string;
    resetSuccess: string;
    failedSignIn: string;
    firstNameLabel: string;
    lastNameLabel: string;
    registeringAs: string;
    customerRole: string;
    rolesNote: string;
    createAccount: string;
    haveAccountPrompt: string;
    signInLink: string;
    needAccountPrompt: string;
    signUpLink: string;
  };
  sidebar: {
    brand: string;
    nav: {
      overview: string;
      applications: string;
      policies: string;
      claims: string;
      browseProducts: string;
      getQuote: string;
      forYou: string;
      profile: string;
      analytics: string;
      products: string;
      companies: string;
      users: string;
      auditLog: string;
      mlModels: string;
    };
    search: string;
    readonlyRole: string;
    signOutTitle: string;
  };
  profile: {
    accessDenied: string;
    accessDeniedHint: string;
    errorLoading: string;
    errorLoadingHint: string;
    accountInformation: string;
    emailAddress: string;
    role: string;
    memberSince: string;
    companyAffiliation: string;
    security: string;
    securityHint: string;
    recentActivity: string;
    noActivity: string;
    dataRights: string;
  };
  dashboard: {
    welcomeBack: string;
    overviewSubtitle: string;
    stats: {
      applications: string;
      activePolicies: string;
      openClaims: string;
      totalPremium: string;
    };
    recentActivity: string;
    noActivity: string;
    // Agent
    agentTitle: string;
    agentSubtitle: string;
    pendingApps: string;
    pendingClaims: string;
    approvedToday: string;
    // Company admin
    companyTitle: string;
    companySubtitle: string;
    totalApps: string;
    issuedPolicies: string;
    fraudFlags: string;
    revenue: string;
    // Platform admin
    adminTitle: string;
    adminSubtitle: string;
    totalUsers: string;
    totalCompanies: string;
    totalProducts: string;
    platformRevenue: string;
  };
};

const en: LocaleMessages = {
  common: {
    signIn: 'Sign in',
    signOut: 'Sign Out',
    signUp: 'Sign up',
    save: 'Save',
    cancel: 'Cancel',
    loading: 'Loading...',
    submitting: 'Submitting...',
    error: 'Error',
    success: 'Success',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back',
    next: 'Next',
    search: 'Search',
    noData: 'No data available',
    language: 'Language',
  },
  landing: {
    badge: 'Next-Gen Insurance Platform',
    heroLine1: 'The Intelligent Future of',
    heroBrand: 'Insurance SaaS',
    heroSubtitle:
      'Empowering insurance companies, agents, and clients with AI. Streamline workflows, analyze data in real-time, and make smarter decisions.',
    ctaPrimary: 'Start Free Trial',
    ctaSecondary: 'Book a Demo',
    productsHeading: 'Available Insurance Products',
    productsSubtitle:
      'Select a product to get started with our AI-driven application process.',
    applyNow: 'Apply Now',
    fromPrice: 'From',
    contactForPricing: 'Contact for pricing',
    noDescription: 'No description provided.',
    errorLoad:
      'Failed to load products. Please ensure the backend is running.',
  },
  auth: {
    signInTitle: 'Sign in to your account',
    signInSubtitle: 'Or',
    signUpTitle: 'Create your account',
    signUpSubtitle: 'Or',
    emailLabel: 'Email address',
    emailPlaceholder: 'name@example.com',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••',
    forgotPassword: 'Forgot password?',
    signInButton: 'Sign in',
    quickDemoDivider: 'Quick demo login',
    quickDemoHint: 'One-click login — uses password Password123! for all demo accounts.',
    demoCustomer: 'Customer',
    demoAgent: 'Agent',
    demoCompanyAdmin: 'Co. Admin',
    demoPlatform: 'Platform',
    resetSuccess: 'Password reset successful. Please sign in with your new password.',
    failedSignIn: 'Failed to sign in',
    firstNameLabel: 'First Name',
    lastNameLabel: 'Last Name',
    registeringAs: 'Registering as',
    customerRole: 'Customer',
    rolesNote: 'Agent and Admin accounts must be provisioned by the platform administrator.',
    createAccount: 'Create account',
    haveAccountPrompt: 'sign in to your existing account',
    signInLink: 'sign in to your existing account',
    needAccountPrompt: 'create a new account',
    signUpLink: 'create a new account',
  },
  sidebar: {
    brand: 'InsurSaaS',
    nav: {
      overview: 'Overview',
      applications: 'Applications',
      policies: 'Policies',
      claims: 'Claims',
      browseProducts: 'Browse Products',
      getQuote: 'Get a Quote',
      forYou: 'For You',
      profile: 'Profile',
      analytics: 'Analytics',
      products: 'Products',
      companies: 'Companies',
      users: 'Users',
      auditLog: 'Audit Log',
      mlModels: 'ML Models',
    },
    search: 'Search',
    readonlyRole: 'Read-Only',
    signOutTitle: 'Sign Out',
  },
  profile: {
    accessDenied: 'Access Denied',
    accessDeniedHint: 'Please sign in to view your profile.',
    errorLoading: 'Error Loading Profile',
    errorLoadingHint: 'We could not load your profile information. Please try again later.',
    accountInformation: 'Account Information',
    emailAddress: 'Email Address',
    role: 'Role',
    memberSince: 'Member Since',
    companyAffiliation: 'Company Affiliation',
    security: 'Security',
    securityHint: 'Your password is encrypted and never stored in plain text.',
    recentActivity: 'Your Recent Activity',
    noActivity: 'No recent activity yet.',
    dataRights: 'Data Rights',
  },
  dashboard: {
    welcomeBack: 'Welcome back',
    overviewSubtitle: 'Here is an overview of your insurance portfolio.',
    stats: {
      applications: 'Applications',
      activePolicies: 'Active Policies',
      openClaims: 'Open Claims',
      totalPremium: 'Total Premium',
    },
    recentActivity: 'Recent Activity',
    noActivity: 'No recent activity found.',
    agentTitle: 'Agent Workspace',
    agentSubtitle: 'Review applications and claims awaiting your attention.',
    pendingApps: 'Pending Applications',
    pendingClaims: 'Pending Claims',
    approvedToday: 'Approved Today',
    companyTitle: 'Company Analytics',
    companySubtitle: 'Real-time view of your products and portfolio.',
    totalApps: 'Total Applications',
    issuedPolicies: 'Issued Policies',
    fraudFlags: 'Fraud Flags',
    revenue: 'Revenue',
    adminTitle: 'Platform Overview',
    adminSubtitle: 'Cross-tenant view of platform activity.',
    totalUsers: 'Total Users',
    totalCompanies: 'Total Companies',
    totalProducts: 'Total Products',
    platformRevenue: 'Platform Revenue',
  },
};

const uk: LocaleMessages = {
  common: {
    signIn: 'Увійти',
    signOut: 'Вийти',
    signUp: 'Зареєструватись',
    save: 'Зберегти',
    cancel: 'Скасувати',
    loading: 'Завантаження...',
    submitting: 'Відправка...',
    error: 'Помилка',
    success: 'Успіх',
    confirm: 'Підтвердити',
    delete: 'Видалити',
    edit: 'Редагувати',
    back: 'Назад',
    next: 'Далі',
    search: 'Пошук',
    noData: 'Немає даних',
    language: 'Мова',
  },
  landing: {
    badge: 'Страхова платформа нового покоління',
    heroLine1: 'Інтелектуальне майбутнє',
    heroBrand: 'страхової SaaS-платформи',
    heroSubtitle:
      'Допомагаємо страховим компаніям, агентам та клієнтам використовувати AI. Оптимізуйте процеси, аналізуйте дані у реальному часі та приймайте розумніші рішення.',
    ctaPrimary: 'Розпочати безкоштовно',
    ctaSecondary: 'Замовити демо',
    productsHeading: 'Доступні страхові продукти',
    productsSubtitle:
      'Оберіть продукт, щоб розпочати заявку з підтримкою AI.',
    applyNow: 'Подати заявку',
    fromPrice: 'Від',
    contactForPricing: 'Уточнюйте ціну',
    noDescription: 'Опис відсутній.',
    errorLoad:
      'Не вдалося завантажити продукти. Перевірте, чи запущений бекенд.',
  },
  auth: {
    signInTitle: 'Вхід до акаунту',
    signInSubtitle: 'або',
    signUpTitle: 'Створення акаунту',
    signUpSubtitle: 'або',
    emailLabel: 'Електронна адреса',
    emailPlaceholder: 'name@example.com',
    passwordLabel: 'Пароль',
    passwordPlaceholder: '••••••••',
    forgotPassword: 'Забули пароль?',
    signInButton: 'Увійти',
    quickDemoDivider: 'Швидкий вхід демо',
    quickDemoHint: 'Вхід в один клік — для усіх демо-акаунтів використовується пароль Password123!.',
    demoCustomer: 'Клієнт',
    demoAgent: 'Агент',
    demoCompanyAdmin: 'Адмін комп.',
    demoPlatform: 'Платформа',
    resetSuccess: 'Пароль успішно скинуто. Увійдіть з новим паролем.',
    failedSignIn: 'Не вдалося увійти',
    firstNameLabel: "Ім'я",
    lastNameLabel: 'Прізвище',
    registeringAs: 'Реєструюсь як',
    customerRole: 'Клієнт',
    rolesNote: 'Акаунти агентів та адміністраторів створюються адміністратором платформи.',
    createAccount: 'Створити акаунт',
    haveAccountPrompt: 'увійти до існуючого акаунту',
    signInLink: 'увійти до існуючого акаунту',
    needAccountPrompt: 'створити новий акаунт',
    signUpLink: 'створити новий акаунт',
  },
  sidebar: {
    brand: 'InsurSaaS',
    nav: {
      overview: 'Огляд',
      applications: 'Заявки',
      policies: 'Поліси',
      claims: 'Виплати',
      browseProducts: 'Каталог продуктів',
      getQuote: 'Отримати тариф',
      forYou: 'Для вас',
      profile: 'Профіль',
      analytics: 'Аналітика',
      products: 'Продукти',
      companies: 'Компанії',
      users: 'Користувачі',
      auditLog: 'Журнал аудиту',
      mlModels: 'ML-моделі',
    },
    search: 'Пошук',
    readonlyRole: 'Лише читання',
    signOutTitle: 'Вийти',
  },
  profile: {
    accessDenied: 'Доступ заборонено',
    accessDeniedHint: 'Увійдіть, щоб переглянути профіль.',
    errorLoading: 'Помилка завантаження профілю',
    errorLoadingHint: 'Не вдалося завантажити дані профілю. Спробуйте пізніше.',
    accountInformation: 'Дані акаунту',
    emailAddress: 'Електронна адреса',
    role: 'Роль',
    memberSince: 'Зареєстрований',
    companyAffiliation: 'Компанія',
    security: 'Безпека',
    securityHint: 'Ваш пароль зашифровано та ніколи не зберігається у відкритому вигляді.',
    recentActivity: 'Остання активність',
    noActivity: 'Активності поки немає.',
    dataRights: 'Права на дані',
  },
  dashboard: {
    welcomeBack: 'Вітаємо знову',
    overviewSubtitle: 'Ось огляд вашого страхового портфеля.',
    stats: {
      applications: 'Заявки',
      activePolicies: 'Активні поліси',
      openClaims: 'Відкриті виплати',
      totalPremium: 'Загальний внесок',
    },
    recentActivity: 'Остання активність',
    noActivity: 'Активності не знайдено.',
    agentTitle: 'Робоче місце агента',
    agentSubtitle: 'Перегляньте заявки та виплати, що очікують на ваш розгляд.',
    pendingApps: 'Заявки в очікуванні',
    pendingClaims: 'Виплати в очікуванні',
    approvedToday: 'Схвалено сьогодні',
    companyTitle: 'Аналітика компанії',
    companySubtitle: 'Перегляд продуктів і портфеля у реальному часі.',
    totalApps: 'Усього заявок',
    issuedPolicies: 'Видано полісів',
    fraudFlags: 'Ознаки шахрайства',
    revenue: 'Дохід',
    adminTitle: 'Огляд платформи',
    adminSubtitle: 'Крос-тенантний перегляд активності платформи.',
    totalUsers: 'Усього користувачів',
    totalCompanies: 'Усього компаній',
    totalProducts: 'Усього продуктів',
    platformRevenue: 'Дохід платформи',
  },
};

export const messages: Record<Locale, LocaleMessages> = { en, uk };

/**
 * Type-safe key path. We don't enforce statically because the path strings are
 * short and Jest tests would catch any typos when we wire this up to real
 * surfaces — keeping the types simple avoids generic acrobatics for thesis-level
 * payoff.
 */
export type TKey = string;
