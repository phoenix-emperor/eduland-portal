/**
 * @file app/change-password/page.tsx
 * @description Standalone Server Component page for forced password change on first-time login.
 */

import { requireAuth } from '@/lib/auth/guard';
import ChangePasswordForm from './ChangePasswordForm';

export default async function ChangePasswordPage() {
  const { user } = await requireAuth();

  return (
    <div className="min-h-screen bg-olive-50 flex items-center justify-center p-4 sm:p-6">
      <ChangePasswordForm userEmail={user.email || 'Your account'} />
    </div>
  );
}
