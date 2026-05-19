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
    <div className="min-h-screen bg-zinc-950 text-white">
      <DashboardSidebar />
      <main className="md:ml-60 px-4 md:px-8 pt-16 md:pt-6 pb-6">
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
