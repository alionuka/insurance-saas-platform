import DashboardSidebar from '@/components/DashboardSidebar';
import PageTransition from '@/components/PageTransition';

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
    </div>
  );
}
