'use client';

import { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, Check } from 'lucide-react';

type TourStep = {
  selector?: string;
  title: string;
  body: string;
};

const STORAGE_KEY = 'onboarding_completed_v1';

const STEPS_BY_ROLE: Record<string, TourStep[]> = {
  CUSTOMER: [
    {
      title: 'Welcome to InsurSaaS',
      body: 'Take a quick 30-second tour to learn how to manage your insurance portfolio. You can skip anytime.',
    },
    {
      selector: '[data-tour="sidebar-nav"]',
      title: 'Your Dashboard',
      body: 'Browse applications, active policies, and submitted claims from the sidebar. Everything stays one click away.',
    },
    {
      selector: 'a[href="/dashboard/client/quote"]',
      title: 'Get an Instant Quote',
      body: 'Compare products and submit applications in seconds. Our ML model assesses your risk profile in real time.',
    },
    {
      selector: 'a[href="/dashboard/client/recommendations"]',
      title: 'Personalized Recommendations',
      body: 'See products tailored to your profile, ranked by relevance using our content-based recommendation engine.',
    },
    {
      selector: '[data-tour="global-search"]',
      title: 'Fast Search',
      body: 'Press ⌘K (or Ctrl+K) anywhere to search across your applications, policies, and claims.',
    },
    {
      selector: '[data-tour="notifications"]',
      title: 'Stay Updated',
      body: 'Notifications appear here whenever your applications or policies change status. You\'re all set — happy browsing!',
    },
  ],
  AGENT: [
    {
      title: 'Welcome, Agent',
      body: 'Quick tour of your underwriting workspace. You can skip anytime.',
    },
    {
      selector: 'a[href="/dashboard/agent/applications"]',
      title: 'Application Queue',
      body: 'Review pending applications with ML risk scores. Approve or reject individually — or use bulk actions for batches.',
    },
    {
      selector: 'a[href="/dashboard/agent/claims"]',
      title: 'Claims Investigation',
      body: 'Process filed claims. Our fraud detection model flags suspicious cases so you can focus your attention.',
    },
    {
      selector: '[data-tour="global-search"]',
      title: 'Fast Search',
      body: 'Press ⌘K to jump straight to any application, policy, or claim by ID or description.',
    },
    {
      selector: '[data-tour="notifications"]',
      title: 'Real-Time Activity',
      body: 'New applications and claims appear in your notifications bell as customers submit them.',
    },
  ],
  COMPANY_ADMIN: [
    {
      title: 'Welcome, Company Admin',
      body: 'Quick tour of your company portal. You can skip anytime.',
    },
    {
      selector: 'a[href="/dashboard/company"]',
      title: 'Live Analytics',
      body: 'Track your products\' performance, policy growth, and claim ratios with live charts that refresh on every load.',
    },
    {
      selector: 'a[href="/dashboard/company/products"]',
      title: 'Product Catalog',
      body: 'Create and manage the insurance products your company offers. Set base premiums and product types here.',
    },
    {
      selector: 'a[href="/dashboard/company/policies"]',
      title: 'Active Policies',
      body: 'Browse all policies tied to your products — premium amounts, statuses, and customer details at a glance.',
    },
    {
      selector: 'a[href="/dashboard/company/claims"]',
      title: 'Claims Overview',
      body: 'Monitor claims against your products and watch for emerging patterns. You\'re ready to go!',
    },
  ],
  PLATFORM_ADMIN: [
    {
      title: 'Welcome, Platform Admin',
      body: 'Quick tour of your platform-level controls. You can skip anytime.',
    },
    {
      selector: 'a[href="/dashboard/admin/companies"]',
      title: 'Tenant Management',
      body: 'Onboard new insurance companies and inspect their performance across the platform.',
    },
    {
      selector: 'a[href="/dashboard/admin/users"]',
      title: 'User Management',
      body: 'Browse every user across every role. Provision staff accounts and view customer profiles in detail.',
    },
    {
      selector: 'a[href="/dashboard/admin/audit-logs"]',
      title: 'Compliance Audit Log',
      body: 'Every meaningful action — logins, status changes, payments — is recorded here for compliance reviews.',
    },
    {
      selector: '[data-tour="global-search"]',
      title: 'Platform-Wide Search',
      body: 'Press ⌘K to instantly find any resource across all tenants. You\'re fully oriented — enjoy!',
    },
  ],
};

const TOOLTIP_WIDTH = 380;
const TOOLTIP_HEIGHT_EST = 240;
const VIEWPORT_PADDING = 16;
const SPOTLIGHT_PADDING = 8;

export default function OnboardingTour() {
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
      if (!user?.role || !STEPS_BY_ROLE[user.role]) return;

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
        if (!user?.role || !STEPS_BY_ROLE[user.role]) return;
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
        className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-indigo-500/10 p-6"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-indigo-400" />
            </div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
              Step {stepIndex + 1} of {steps.length}
            </span>
          </div>
          <button
            onClick={finish}
            className="text-zinc-500 hover:text-white transition-colors p-1 -mr-1 rounded"
            aria-label="Close tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h3 id="onboarding-title" className="text-lg font-bold text-white mb-2">
          {currentStep.title}
        </h3>
        <p className="text-sm text-zinc-400 leading-relaxed">{currentStep.body}</p>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mt-5 mb-5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all ${
                i === stepIndex
                  ? 'bg-indigo-500 w-6'
                  : i < stepIndex
                  ? 'bg-indigo-500/40 w-1.5'
                  : 'bg-zinc-700 w-1.5'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={finish}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors font-medium"
          >
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                onClick={() => setStepIndex(stepIndex - 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Back
              </button>
            )}
            <button
              onClick={advance}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
            >
              {isLast ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Got it
                </>
              ) : (
                <>
                  Next
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
