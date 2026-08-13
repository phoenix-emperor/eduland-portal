/**
 * @file lib/auth/guard.ts
 * @description Server-side layout and route guard helper for Eduland School Portal.
 * Verifies active session authentication and enforces role-based access control.
 */

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { UserRole, Profile } from "@/lib/types/database";
import { getDashboardPathForRole } from "@/lib/auth/role";
import { User } from "@supabase/supabase-js";

/**
 * Ensures that the current request is authenticated and that the user's role matches `expectedRole`
 * (or is included in the array of `expectedRole`s).
 * If unauthenticated, redirects to `/login`.
 * If authenticated with a role not present in `allowed`, redirects to the user's appropriate role dashboard.
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
  const userRole = typedProfile?.role;

  const allowed = Array.isArray(expectedRole) ? expectedRole : [expectedRole];

  if (!userRole || !allowed.includes(userRole)) {
    const correctPath = getDashboardPathForRole(userRole);
    redirect(correctPath);
  }

  return { user, profile: typedProfile };
}
