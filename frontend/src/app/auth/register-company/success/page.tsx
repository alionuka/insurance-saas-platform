'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Clock, CheckCircle2, ArrowRight, Building2 } from 'lucide-react';
import { useT } from '@/i18n/LocaleProvider';
import LocaleSwitcher from '@/i18n/LocaleSwitcher';

function SuccessContent() {
  const searchParams = useSearchParams();
  const companyName = searchParams.get('company') ?? 'your company';
  const { t } = useT();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <div className="absolute top-4 right-4">
        <LocaleSwitcher variant="nav" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-blue-700/10 border border-blue-700/20 flex items-center justify-center">
            <Clock className="h-9 w-9 text-blue-700" />
          </div>
        </div>

        <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">
          {t('auth.pendingReviewTitle')}
        </h1>
        <p className="mt-3 text-center text-slate-600 leading-relaxed">
          {t('auth.pendingReviewSubtitle1')}{' '}
          <span className="text-slate-900 font-semibold inline-flex items-center gap-1">
            <Building2 className="h-4 w-4 text-blue-700" />
            {companyName}
          </span>{' '}
          {t('auth.pendingReviewSubtitle2')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-slate-900">
                {t('auth.pendingStep1Title')}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('auth.pendingStep1Subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="h-5 w-5 rounded-full border-2 border-blue-400 shrink-0 mt-0.5 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">
                {t('auth.pendingStep2Title')}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('auth.pendingStep2Subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 opacity-60">
            <div className="h-5 w-5 rounded-full border-2 border-slate-300 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-slate-900">
                {t('auth.pendingStep3Title')}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('auth.pendingStep3Subtitle')}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200/60">
            <div className="p-3 rounded-lg bg-blue-700/5 border border-blue-700/15">
              <p className="text-[11px] text-blue-600/70 leading-relaxed">
                <strong className="text-blue-600">{t('auth.pendingDemoNoteLabel')}</strong>{' '}
                {t('auth.pendingDemoNoteText')}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/auth/sign-in"
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-600 transition-colors"
          >
            {t('auth.pendingBackToSignIn')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterCompanySuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Clock className="h-8 w-8 text-blue-700 animate-pulse" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
