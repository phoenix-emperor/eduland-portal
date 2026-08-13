/**
 * @file app/dashboard/admin/layout.tsx
 * @description Layout component for the School Admin section of Eduland Portal.
 * Enforces role access for both 'admin' and 'super_admin' roles.
 */

import { requireRole } from '@/lib/auth/guard';
import { DashboardHeader } from '@/components/dashboard/Header';

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Allow both admin and super_admin roles to access admin pages
  const { profile } = await requireRole(['admin', 'super_admin']);

  const roleDisplayName = profile?.role === 'super_admin' ? 'Super Admin' : 'Admin';

  return (
    <div className="min-h-screen bg-olive-50 flex flex-col">
      <DashboardHeader
        fullName={profile?.full_name || 'Admin User'}
        roleDisplayName={roleDisplayName}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
