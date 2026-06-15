import { cookies } from 'next/headers';
import { Building2, Palette, AlertCircle } from 'lucide-react';
import CompanyBrandingForm from './CompanyBrandingForm';
import { getT } from '@/i18n/getT';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type Company = {
  id: string;
  name: string;
  description: string | null;
  primaryColor: string | null;
  logoUrl: string | null;
  status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED';
  licenseNumber?: string | null;
  country?: string | null;
  contactPhone?: string | null;
};

async function getMyCompany(): Promise<Company | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value ?? '';
    if (!token) return null;
    const res = await fetch(`${API_URL}/companies/me`, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/**
 * COMPANY_ADMIN tenant branding settings. The form lets admins edit
 * display name, description, primary color, and upload a logo. Changes
 * are visible to end-customers on product cards, claim/policy detail
 * pages, and email receipts.
 */
export default async function CompanySettingsPage() {
  const { t } = await getT();
  const company = await getMyCompany();

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{t('finale.noCompanyFound')}</h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-md">
          This page is only available to COMPANY_ADMIN accounts assigned to an
          insurance company tenant.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
          <Palette className="h-7 w-7 text-blue-700" />
          {t('finale.tenantBranding')}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">
          {t('finale.customiseHow')} <span className="text-slate-900 dark:text-slate-100 font-medium">{company.name}</span>{' '}
          appears to your customers — name, description, primary colour, and
          logo. Changes propagate to product cards, claim details, and email
          receipts in real time.
        </p>
      </div>

      {company.status === 'PENDING_VERIFICATION' && (
        <div className="p-4 rounded-lg bg-blue-700/5 border border-blue-700/30 text-sm text-blue-200/80">
          Your tenant is still pending verification. Branding changes are
          saved, but they only become visible once a platform administrator
          activates your account.
        </div>
      )}

      <CompanyBrandingForm
        initialValues={{
          name: company.name,
          description: company.description ?? '',
          primaryColor: company.primaryColor ?? '#3b82f6',
          logoUrl: company.logoUrl ?? null,
        }}
      />

      {/* Read-only KYC summary */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          {t('finale.registrationRecord')}
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">
              {t('finale.licenceNumber')}
            </dt>
            <dd className="text-slate-900 dark:text-slate-100 font-mono">
              {company.licenseNumber || <span className="text-slate-400 dark:text-slate-500">—</span>}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">
              {t('companies.country').replace(':', '')}
            </dt>
            <dd className="text-slate-900 dark:text-slate-100 font-mono">
              {company.country || <span className="text-slate-400 dark:text-slate-500">—</span>}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">
              {t('finale.compliancePhoneLabel')}
            </dt>
            <dd className="text-slate-900 dark:text-slate-100 font-mono">
              {company.contactPhone || <span className="text-slate-400 dark:text-slate-500">—</span>}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">
              {t('finale.tenantStatusLabel')}
            </dt>
            <dd>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                  company.status === 'ACTIVE'
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                    : company.status === 'PENDING_VERIFICATION'
                      ? 'bg-blue-700/10 text-blue-700 border-blue-700/20'
                      : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
                }`}
              >
                {company.status.replace('_', ' ')}
              </span>
            </dd>
          </div>
        </dl>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-4 italic">
          Registration details are read-only. To amend them, contact platform
          support.
        </p>
      </div>
    </div>
  );
}
