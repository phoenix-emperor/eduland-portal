import { requireRole } from '@/lib/auth/guard';
import { DashboardHeader } from '@/components/dashboard/Header';

export default async function SuperAdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireRole('super_admin');

  return (
    <div className="min-h-screen bg-olive-50 flex flex-col">
      <DashboardHeader
        fullName={profile?.full_name || 'Super Admin User'}
        roleDisplayName="Super Admin"
      />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
