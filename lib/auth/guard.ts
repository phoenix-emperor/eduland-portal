/**
 * @file lib/auth/guard.ts
 * @description Server-side layout and route guard helper for Eduland School Portal.
 * Verifies active session authentication, enforces role-based access control,
 * intercepts disabled user accounts, and forces password change on first login.
 */

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { UserRole, Profile } from "@/lib/types/database";
import { getDashboardPathForRole } from "@/lib/auth/role";
import { User } from "@supabase/supabase-js";

/**
 * Ensures that the current request is authenticated and that the user's role matches `expectedRole`
 * (or is included in the array of `expectedRole`s).
 *
 * Automatic Interceptions:
 * 1. Disabled Accounts: Signs out and redirects to `/login?error=account_disabled`.
 * 2. Force Password Change: Redirects users with `must_change_password === true` to `/change-password`.
 *
 * @param expectedRole - A single UserRole or array of UserRoles allowed to access the page or action.
 * @returns Object containing the Supabase `user` object and `profile` record.
 */
export async function requireRole(
  expectedRole: UserRole | UserRole[]
): Promise<{
  user: User;
  profile: Profile | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const typedProfile = profile as Profile | null;

  // Intercept 1: Immediate sign-out and redirect for disabled accounts
  if (typedProfile?.is_disabled) {
    await supabase.auth.signOut();
    redirect("/login?error=account_disabled");
  }

  // Intercept 2: Force password change on first login
  if (typedProfile?.must_change_password) {
    redirect("/change-password");
  }

  const userRole = typedProfile?.role;
  const allowed = Array.isArray(expectedRole) ? expectedRole : [expectedRole];

  if (!userRole || !allowed.includes(userRole)) {
    const correctPath = getDashboardPathForRole(userRole);
    redirect(correctPath);
  }

  return { user, profile: typedProfile };
}

/**
 * Ensures that the current request is authenticated for any valid user session.
 * Used by standalone routes like `/change-password`.
 */
export async function requireAuth(): Promise<{
  user: User;
  profile: Profile | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const typedProfile = profile as Profile | null;

  if (typedProfile?.is_disabled) {
    await supabase.auth.signOut();
    redirect("/login?error=account_disabled");
  }

  return { user, profile: typedProfile };
}
