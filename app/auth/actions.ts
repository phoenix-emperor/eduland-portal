"use server";

import { createClient } from "@/lib/supabase/server";
import { getDashboardPathForRole } from "@/lib/auth/role";
import { UserRole } from "@/lib/types/database";
import { redirect } from "next/navigation";

export type FormState = {
  error: string | null;
};

export async function loginAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    if (data.user) {
      // Create a fresh client after sign in so the newly set cookies are included
      const authenticatedSupabase = await createClient();
      const { data: profile } = await authenticatedSupabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      const role = (profile as { role?: UserRole | string } | null)?.role;
      const targetPath = getDashboardPathForRole(role);
      redirect(targetPath);
    }

    return { error: "Authentication failed. Please try again." };
  } catch (err: unknown) {
    // Next.js redirect throws a special NEXT_REDIRECT error which must be re-thrown
    if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
      throw err;
    }
    return {
      error:
        err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
