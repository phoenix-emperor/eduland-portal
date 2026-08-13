import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getDashboardPathForRole } from '@/lib/auth/role';
import { UserRole } from '@/lib/types/database';

export default async function DashboardRootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const typedProfile = profile as { role?: UserRole } | null;
  const targetPath = getDashboardPathForRole(typedProfile?.role);
  redirect(targetPath);
}
