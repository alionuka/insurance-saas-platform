'use client';

import { useState, useEffect, useCallback, useLayoutEffect, useMemo } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, Check } from 'lucide-react';
import { useT } from '@/i18n/LocaleProvider';

type TourStep = {
  selector?: string;
  title: string;
  body: string;
};

const STORAGE_KEY = 'onboarding_completed_v1';
const VALID_ROLES = ['CUSTOMER', 'AGENT', 'COMPANY_ADMIN', 'PLATFORM_ADMIN'];

const TOOLTIP_WIDTH = 380;
const TOOLTIP_HEIGHT_EST = 240;
const VIEWPORT_PADDING = 16;
const SPOTLIGHT_PADDING = 8;

export default function OnboardingTour() {
  const { t } = useT();

  const STEPS_BY_ROLE = useMemo<Record<string, TourStep[]>>(() => ({
    CUSTOMER: [
      {
        title: t('onboarding.customer.step1Title'),
        body: t('onboarding.customer.step1Body'),
      },
      {
        selector: '[data-tour="sidebar-nav"]',
        title: t('onboarding.customer.step2Title'),
        body: t('onboarding.customer.step2Body'),
      },
      {
        selector: 'a[href="/dashboard/client/quote"]',
        title: t('onboarding.customer.step3Title'),
        body: t('onboarding.customer.step3Body'),
      },
      {
        selector: 'a[href="/dashboard/client/recommendations"]',
        title: t('onboarding.customer.step4Title'),
        body: t('onboarding.customer.step4Body'),
      },
      {
        selector: '[data-tour="global-search"]',
        title: t('onboarding.customer.step5Title'),
        body: t('onboarding.customer.step5Body'),
      },
      {
        selector: '[data-tour="notifications"]',
        title: t('onboarding.customer.step6Title'),
        body: t('onboarding.customer.step6Body'),
      },
    ],
    AGENT: [
      {
        title: t('onboarding.agent.step1Title'),
        body: t('onboarding.agent.step1Body'),
      },
      {
        selector: 'a[href="/dashboard/agent/applications"]',
        title: t('onboarding.agent.step2Title'),
        body: t('onboarding.agent.step2Body'),
      },
      {
        selector: 'a[href="/dashboard/agent/claims"]',
        title: t('onboarding.agent.step3Title'),
        body: t('onboarding.agent.step3Body'),
      },
      {
        selector: '[data-tour="global-search"]',
        title: t('onboarding.agent.step4Title'),
        body: t('onboarding.agent.step4Body'),
      },
      {
        selector: '[data-tour="notifications"]',
        title: t('onboarding.agent.step5Title'),
        body: t('onboarding.agent.step5Body'),
      },
    ],
    COMPANY_ADMIN: [
      {
        title: t('onboarding.companyAdmin.step1Title'),
        body: t('onboarding.companyAdmin.step1Body'),
      },
      {
        selector: 'a[href="/dashboard/company"]',
        title: t('onboarding.companyAdmin.step2Title'),
        body: t('onboarding.companyAdmin.step2Body'),
      },
      {
        selector: 'a[href="/dashboard/company/products"]',
        title: t('onboarding.companyAdmin.step3Title'),
        body: t('onboarding.companyAdmin.step3Body'),
      },
      {
        selector: 'a[href="/dashboard/company/policies"]',
        title: t('onboarding.companyAdmin.step4Title'),
        body: t('onboarding.companyAdmin.step4Body'),
      },
      {
        selector: 'a[href="/dashboard/company/claims"]',
        title: t('onboarding.companyAdmin.step5Title'),
        body: t('onboarding.companyAdmin.step5Body'),
      },
    ],
    PLATFORM_ADMIN: [
      {
        title: t('onboarding.platformAdmin.step1Title'),
        body: t('onboarding.platformAdmin.step1Body'),
      },
      {
        selector: 'a[href="/dashboard/admin/companies"]',
        title: t('onboarding.platformAdmin.step2Title'),
        body: t('onboarding.platformAdmin.step2Body'),
      },
      {
        selector: 'a[href="/dashboard/admin/users"]',
        title: t('onboarding.platformAdmin.step3Title'),
        body: t('onboarding.platformAdmin.step3Body'),
      },
      {
        selector: 'a[href="/dashboard/admin/audit-logs"]',
        title: t('onboarding.platformAdmin.step4Title'),
        body: t('onboarding.platformAdmin.step4Body'),
      },
      {
        selector: '[data-tour="global-search"]',
        title: t('onboarding.platformAdmin.step5Title'),
        body: t('onboarding.platformAdmin.step5Body'),
      },
    ],
  }), [t]);

  const [role, setRole] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [active, setActive] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tick, setTick] = useState(0);

  // Detect first visit + read role
  useEffect(() => {
    try {
      const completed = localStorage.getItem(STORAGE_KEY);
      if (completed === 'true') return;

      const userStr = localStorage.getItem('user');
      if (!userStr) return;

      const user = JSON.parse(userStr);
      if (!user?.role || !VALID_ROLES.includes(user.role)) return;

      setRole(user.role);
      // Delay so sidebar/nav has mounted client-side before we measure
      const timer = setTimeout(() => setActive(true), 900);
      return () => clearTimeout(timer);
    } catch {
      // ignore
    }
  }, []);

  // Allow external "restart tour" trigger
  useEffect(() => {
    const handler = () => {
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) return;
        const user = JSON.parse(userStr);
        if (!user?.role || !VALID_ROLES.includes(user.role)) return;
        setRole(user.role);
        setStepIndex(0);
        setActive(true);
      } catch {}
    };
    window.addEventListener('onboarding:restart', handler);
    return () => window.removeEventListener('onboarding:restart', handler);
  }, []);

  const steps = role ? STEPS_BY_ROLE[role] : [];
  const currentStep = steps[stepIndex];

  const computePosition = useCallback(() => {
    if (!currentStep?.selector) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(currentStep.selector);
    if (!el) {
      setTargetRect(null);
      return;
    }
    const rect = (el as HTMLElement).getBoundingClientRect();
    // Treat offscreen / collapsed elements as missing (e.g., mobile drawer)
    if (
      rect.width === 0 ||
      rect.height === 0 ||
      rect.right < 0 ||
      rect.left > window.innerWidth
    ) {
      setTargetRect(null);
      return;
    }
    setTargetRect(rect);
  }, [currentStep]);

  useLayoutEffect(() => {
    if (!active) return;
    computePosition();
  }, [active, stepIndex, tick, computePosition]);

  // Recompute on resize / scroll
  useEffect(() => {
    if (!active) return;
    const handler = () => setTick((t) => t + 1);
    window.addEventListener('resize', handler);
    window.addEventListener('scroll', handler, true);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('scroll', handler, true);
    };
  }, [active]);

  // Lock body scroll while tour is active
  useEffect(() => {
    if (!active) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [active]);

  const finish = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {}
    setActive(false);
    setStepIndex(0);
  };

  const advance = () => {
    if (stepIndex >= steps.length - 1) {
      finish();
    } else {
      setStepIndex(stepIndex + 1);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        finish();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        advance();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (stepIndex > 0) setStepIndex(stepIndex - 1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, stepIndex, steps.length]);

  if (!active || !currentStep) return null;

  // Compute tooltip position relative to target (fallback: center of screen)
  let tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 100,
    width: `${TOOLTIP_WIDTH}px`,
    maxWidth: `calc(100vw - ${VIEWPORT_PADDING * 2}px)`,
  };

  if (targetRect) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const spaceRight = vw - targetRect.right;
    const spaceBelow = vh - targetRect.bottom;
    const spaceAbove = targetRect.top;

    const clampLeft = (l: number) =>
      Math.max(VIEWPORT_PADDING, Math.min(l, vw - TOOLTIP_WIDTH - VIEWPORT_PADDING));
    const clampTop = (t: number) =>
      Math.max(VIEWPORT_PADDING, Math.min(t, vh - TOOLTIP_HEIGHT_EST - VIEWPORT_PADDING));

    if (spaceRight >= TOOLTIP_WIDTH + VIEWPORT_PADDING) {
      tooltipStyle = {
        position: 'fixed',
        left: `${targetRect.right + VIEWPORT_PADDING}px`,
        top: `${clampTop(targetRect.top)}px`,
        zIndex: 100,
        width: `${TOOLTIP_WIDTH}px`,
        maxWidth: `calc(100vw - ${VIEWPORT_PADDING * 2}px)`,
      };
    } else if (spaceBelow >= TOOLTIP_HEIGHT_EST + VIEWPORT_PADDING) {
      tooltipStyle = {
        position: 'fixed',
        left: `${clampLeft(targetRect.left)}px`,
        top: `${targetRect.bottom + VIEWPORT_PADDING}px`,
        zIndex: 100,
        width: `${TOOLTIP_WIDTH}px`,
        maxWidth: `calc(100vw - ${VIEWPORT_PADDING * 2}px)`,
      };
    } else if (spaceAbove >= TOOLTIP_HEIGHT_EST + VIEWPORT_PADDING) {
      tooltipStyle = {
        position: 'fixed',
        left: `${clampLeft(targetRect.left)}px`,
        top: `${targetRect.top - TOOLTIP_HEIGHT_EST - VIEWPORT_PADDING}px`,
        zIndex: 100,
        width: `${TOOLTIP_WIDTH}px`,
        maxWidth: `calc(100vw - ${VIEWPORT_PADDING * 2}px)`,
      };
    }
  }

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  return (
    <>
      {/* Backdrop with spotlight cut-out */}
      <div className="fixed inset-0 z-[90] pointer-events-auto" aria-hidden="true">
        {targetRect ? (
          <svg className="w-full h-full block" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <mask id="onboarding-spotlight-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={targetRect.left - SPOTLIGHT_PADDING}
                  y={targetRect.top - SPOTLIGHT_PADDING}
                  width={targetRect.width + SPOTLIGHT_PADDING * 2}
                  height={targetRect.height + SPOTLIGHT_PADDING * 2}
                  rx="12"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0,0,0,0.72)"
              mask="url(#onboarding-spotlight-mask)"
            />
            <rect
              x={targetRect.left - SPOTLIGHT_PADDING}
              y={targetRect.top - SPOTLIGHT_PADDING}
              width={targetRect.width + SPOTLIGHT_PADDING * 2}
              height={targetRect.height + SPOTLIGHT_PADDING * 2}
              rx="12"
              fill="none"
              stroke="rgb(99, 102, 241)"
              strokeWidth="2"
              style={{ filter: 'drop-shadow(0 0 14px rgba(99,102,241,0.55))' }}
            />
          </svg>
        ) : (
          <div className="absolute inset-0 bg-black/72" style={{ backgroundColor: 'rgba(0,0,0,0.72)' }} />
        )}
      </div>

      {/* Tooltip card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        style={tooltipStyle}
        className="bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-blue-500/10 p-6"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-700/10 border border-blue-700/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-blue-700" />
            </div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
              {t('onboarding.stepCounter')
                .replace('{current}', String(stepIndex + 1))
                .replace('{total}', String(steps.length))}
            </span>
          </div>
          <button
            onClick={finish}
            className="text-slate-500 hover:text-slate-900 transition-colors p-1 -mr-1 rounded"
            aria-label="Close tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h3 id="onboarding-title" className="text-lg font-bold text-slate-900 mb-2">
          {currentStep.title}
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed">{currentStep.body}</p>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mt-5 mb-5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all ${
                i === stepIndex
                  ? 'bg-blue-700 w-6'
                  : i < stepIndex
                  ? 'bg-blue-700/40 w-1.5'
                  : 'bg-zinc-700 w-1.5'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={finish}
            className="text-xs text-slate-500 hover:text-slate-700 transition-colors font-medium"
          >
            {t('onboarding.buttons.skip')}
          </button>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                onClick={() => setStepIndex(stepIndex - 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                {t('onboarding.buttons.back')}
              </button>
            )}
            <button
              onClick={advance}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-slate-900 bg-blue-700 hover:bg-blue-600 rounded-lg transition-colors shadow-lg shadow-blue-500/20"
            >
              {isLast ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  {t('onboarding.buttons.gotIt')}
                </>
              ) : (
                <>
                  {t('onboarding.buttons.next')}
                  <ChevronRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
