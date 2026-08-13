/**
 * @file app/dashboard/admin/users/page.tsx
 * @description Server Component for Manage Users (Account Invites & Role Assignments) in Admin Dashboard.
 * Fetches school user profiles and maps user emails via Supabase Admin Client listUsers API.
 */

import { requireRole } from '@/lib/auth/guard';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import ManageUsersClient, { UserProfileWithEmail } from './ManageUsersClient';
import { Profile } from '@/lib/types/database';

export default async function ManageUsersPage() {
  const { user, profile } = await requireRole(['admin', 'super_admin']);
  const schoolId = profile?.school_id || '';

  const supabase = await createClient();

  // 1. Fetch all user profiles for acting admin's school
  const { data: profilesRaw } = await (supabase.from('profiles') as any)
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false });

  const rawProfiles: Profile[] = (profilesRaw || []) as Profile[];

  // 2. Fetch auth.users via Privileged Admin Client to join email addresses
  const emailMap: Record<string, string> = {};
  try {
    const adminSupabase = createAdminClient();
    const { data: authData } = await adminSupabase.auth.admin.listUsers();
    if (authData?.users) {
      authData.users.forEach((u) => {
        if (u.id && u.email) {
          emailMap[u.id] = u.email;
        }
      });
    }
  } catch (err) {
    console.error('Failed to list auth users for email mapping:', err);
  }

  // 3. Attach emails to user profiles
  const profilesWithEmail: UserProfileWithEmail[] = rawProfiles.map((p) => ({
    ...p,
    email: emailMap[p.id] || undefined,
  }));

  return (
    <ManageUsersClient
      profiles={profilesWithEmail}
      actingUserRole={profile?.role || 'admin'}
      currentUserId={user.id}
    />
  );
}
