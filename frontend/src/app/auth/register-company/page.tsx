'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Mail,
  Lock,
  Building2,
  User as UserIcon,
  Loader2,
  AlertCircle,
  FileCheck,
  Phone,
  Globe,
} from 'lucide-react';
import { useT } from '@/i18n/LocaleProvider';
import LocaleSwitcher from '@/i18n/LocaleSwitcher';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Self-service tenant onboarding flow with KYC indicators.
 *
 * Captures the insurance company's legal info + a primary admin account.
 * Optional KYC fields (license number, country, contact phone) are stored
 * against the Company row but not externally validated in this thesis
 * scope — production deployments would route these through a compliance
 * provider before transitioning the tenant from PENDING_VERIFICATION
 * to ACTIVE.
 */
export default function RegisterCompanyPage() {
  const router = useRouter();
  const { t } = useT();
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    licenseNumber: '',
    country: '',
    contactPhone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Strip empty optional KYC fields so the backend treats them as omitted
    // rather than failing min-length validation on the country code.
    const payload = Object.fromEntries(
      Object.entries(formData).filter(([, v]) => v !== ''),
    );

    try {
      const response = await fetch(`${API_URL}/auth/register-company`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || t('auth.failedSignIn'));
      }
      // No auto-login — company is PENDING_VERIFICATION. Send the user to a
      // "pending review" page so they understand the next step instead of
      // being dumped into a half-functional dashboard.
      router.push(`/auth/register-company/success?company=${encodeURIComponent(data.company.name)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <div className="absolute top-4 right-4">
        <LocaleSwitcher variant="nav" />
      </div>
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-white">
          {t('auth.registerCompanyTitle')}
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-400 max-w-md mx-auto">
          {t('auth.registerCompanySubtitle')}
        </p>
        <p className="mt-3 text-center text-xs text-zinc-500">
          {t('auth.forCustomersPrompt')}{' '}
          <Link
            href="/auth/sign-up"
            className="font-medium text-blue-400 hover:text-blue-300"
          >
            {t('auth.customerSignUpHere')}
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-zinc-900 py-8 px-6 shadow-xl border border-zinc-800 sm:rounded-2xl sm:px-10">
          {/* KYC disclaimer banner */}
          <div className="mb-6 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 flex gap-3 text-xs text-blue-300/80">
            <FileCheck className="h-4 w-4 shrink-0 mt-0.5 text-blue-400" />
            <p className="leading-relaxed">
              {t('auth.kycNotice')}
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <fieldset className="space-y-4">
              <legend className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                {t('auth.kycSectionCompany')}
              </legend>

              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-zinc-300">
                  {t('auth.companyNameLabel')} *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-4 w-4 text-zinc-500" />
                  </div>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    required
                    minLength={2}
                    maxLength={100}
                    value={formData.companyName}
                    onChange={handleChange}
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-zinc-800 rounded-lg bg-zinc-950 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                    placeholder={t('auth.companyNamePlaceholder')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="licenseNumber" className="block text-sm font-medium text-zinc-300">
                    {t('auth.licenseNumberLabel')}
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FileCheck className="h-4 w-4 text-zinc-500" />
                    </div>
                    <input
                      id="licenseNumber"
                      name="licenseNumber"
                      type="text"
                      maxLength={100}
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      className="appearance-none block w-full pl-10 pr-3 py-2 border border-zinc-800 rounded-lg bg-zinc-950 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                      placeholder="IL-2024-INS-12345"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-zinc-300">
                    {t('auth.countryLabel')}
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Globe className="h-4 w-4 text-zinc-500" />
                    </div>
                    <input
                      id="country"
                      name="country"
                      type="text"
                      minLength={2}
                      maxLength={2}
                      value={formData.country}
                      onChange={(e) =>
                        setFormData({ ...formData, country: e.target.value.toUpperCase() })
                      }
                      className="appearance-none block w-full pl-10 pr-3 py-2 border border-zinc-800 rounded-lg bg-zinc-950 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                      placeholder="UA"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="contactPhone" className="block text-sm font-medium text-zinc-300">
                  {t('auth.contactPhoneLabel')}
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-zinc-500" />
                  </div>
                  <input
                    id="contactPhone"
                    name="contactPhone"
                    type="tel"
                    maxLength={30}
                    value={formData.contactPhone}
                    onChange={handleChange}
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-zinc-800 rounded-lg bg-zinc-950 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                    placeholder="+380 44 555 0000"
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-4 pt-2 border-t border-zinc-800/60">
              <legend className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 pt-3">
                {t('auth.kycSectionAdmin')}
              </legend>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-zinc-300">
                    {t('auth.firstNameLabel')} *
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className="h-4 w-4 text-zinc-500" />
                    </div>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="appearance-none block w-full pl-10 pr-3 py-2 border border-zinc-800 rounded-lg bg-zinc-950 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-zinc-300">
                    {t('auth.lastNameLabel')} *
                  </label>
                  <div className="mt-1">
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-zinc-800 rounded-lg bg-zinc-950 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
                  {t('auth.emailLabel')} *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-zinc-500" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-zinc-800 rounded-lg bg-zinc-950 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                    placeholder={t('auth.emailPlaceholder')}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
                  {t('auth.passwordLabel')} *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-zinc-500" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    maxLength={72}
                    value={formData.password}
                    onChange={handleChange}
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-zinc-800 rounded-lg bg-zinc-950 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                    placeholder={t('auth.passwordPlaceholder')}
                  />
                </div>
              </div>
            </fieldset>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    {t('auth.registerCompanyButton')}
                  </>
                )}
              </button>
              <p className="text-[10px] text-zinc-600 text-center mt-2">
                * {t('auth.requiredFields')}
              </p>
            </div>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-600">
          {t('auth.signInSubtitle')}{' '}
          <Link
            href="/auth/sign-in"
            className="font-medium text-blue-400 hover:text-blue-300"
          >
            {t('auth.haveAccountPrompt')}
          </Link>
        </p>
      </div>
    </div>
  );
}
