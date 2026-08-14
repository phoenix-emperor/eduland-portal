"use server";

/**
 * @file app/change-password/actions.ts
 * @description Server action for forced password change on first-time login.
 */

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/guard";
import { getDashboardPathForRole } from "@/lib/auth/role";
import { redirect } from "next/navigation";

export async function changePasswordAction(newPassword: string) {
  const { user, profile } = await requireAuth();

  if (!newPassword || newPassword.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }

  const supabase = await createClient();

  // 1. Update user password in Supabase Auth using current session
  const { error: updateAuthErr } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateAuthErr) {
    return { error: updateAuthErr.message || "Failed to update password." };
  }

  // 2. Clear must_change_password flag in profiles
  const { error: profileErr } = await (supabase.from("profiles") as any)
    .update({ must_change_password: false })
    .eq("id", user.id);

  if (profileErr) {
    console.error("Failed to clear must_change_password flag:", profileErr);
  }

  // 3. Redirect user to their appropriate role dashboard
  const destinationPath = getDashboardPathForRole(profile?.role);
  redirect(destinationPath);
}
