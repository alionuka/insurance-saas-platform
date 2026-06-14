import DashboardSidebar from '@/components/DashboardSidebar';
import PageTransition from '@/components/PageTransition';
import OnboardingTour from '@/components/onboarding/OnboardingTour';

// All dashboard pages depend on the access_token cookie and the user's role,
// so they must be dynamically rendered per-request (not cached/static).
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060b1a] text-slate-900 dark:text-slate-100">
      <DashboardSidebar />
      {/*
        Main content margin reacts to the sidebar's collapsed state via the
        --sidebar-width CSS variable that the sidebar writes to :root on
        toggle. Defaults to 15rem (expanded) on first paint to avoid layout
        flash; collapses to 4rem when the user folds the sidebar.
      */}
      <main
        className="px-4 md:px-8 pt-16 md:pt-6 pb-6 transition-[margin-left] duration-200 ease-in-out md:ml-[var(--sidebar-width,15rem)]"
      >
        <div className="mx-auto max-w-7xl">
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </main>
      <OnboardingTour />
    </div>
  );
}
