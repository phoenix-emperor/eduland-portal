import { requireRole } from '@/lib/auth/guard';
import { DashboardHeader } from '@/components/dashboard/Header';
import DashboardNav from '@/components/dashboard/DashboardNav';
import { parentNavLinks } from '@/components/dashboard/navLinks';

export default async function ParentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireRole('parent');

  return (
    <div className="min-h-screen bg-olive-50 flex flex-col">
      <DashboardHeader
        fullName={profile?.full_name || 'Parent User'}
        roleDisplayName="Parent"
      />
      <DashboardNav links={parentNavLinks} />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
