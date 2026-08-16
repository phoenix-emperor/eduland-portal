// scripts/seed-demo-accounts.mjs
// Run locally: node scripts/seed-demo-accounts.mjs
// Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in your
// environment (already in .env.local — this script reads process.env
// directly, so run it with `node -r dotenv/config scripts/seed-demo-accounts.mjs`
// if your env isn't already loaded, or adapt to however this project
// loads env vars locally).

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Deliberately NOT forcing must_change_password for these — this is
// demo data meant for showing to potential clients, not a real
// onboarding flow. A forced password-change interruption mid-demo
// would be a bad experience.
const DEMO_PASSWORD = "EdulandDemo2025!";

const teachers = [
  { email: "fola.test@edulandschools.com", fullName: "Folake Adeyemi" },
  { email: "chidi.test@edulandschools.com", fullName: "Chidinma Okafor" },
  { email: "emeka.test@edulandschools.com", fullName: "Emeka Nwachukwu" },
  { email: "ngozi.test@edulandschools.com", fullName: "Ngozi Eze" },
  { email: "tunde.test@edulandschools.com", fullName: "Tunde Bakare" },
  { email: "aisha.test@edulandschools.com", fullName: "Aisha Mohammed" },
];

const parents = [
  { email: "grace.test@edulandschools.com", fullName: "Grace Adebayo" },
  { email: "ibrahim.test@edulandschools.com", fullName: "Ibrahim Suleiman" },
  { email: "patience.test@edulandschools.com", fullName: "Patience Okonkwo" },
];

async function createAccount(email, fullName, role) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error) {
    console.error(`FAILED: ${email} — ${error.message}`);
    return null;
  }

  const userId = data.user.id;

  // The handle_new_auth_user trigger already created a profiles row
  // defaulted to role='parent'. Update it to the real role.
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role, full_name: fullName, must_change_password: false })
    .eq("id", userId);

  if (profileError) {
    console.error(
      `Account created but profile update failed for ${email}: ${profileError.message}`,
    );
    return null;
  }

  console.log(`OK: ${email} (${role}) — id: ${userId}`);
  return { email, fullName, role, id: userId };
}

async function main() {
  console.log("Creating teacher accounts...\n");
  const createdTeachers = [];
  for (const t of teachers) {
    const result = await createAccount(t.email, t.fullName, "teacher");
    if (result) createdTeachers.push(result);
  }

  console.log("\nCreating parent accounts...\n");
  const createdParents = [];
  for (const p of parents) {
    const result = await createAccount(p.email, p.fullName, "parent");
    if (result) createdParents.push(result);
  }

  console.log("\n--- Done ---");
  console.log(`Demo password for all accounts above: ${DEMO_PASSWORD}`);
  console.log("\nThe next SQL seed script looks these accounts up by EMAIL,");
  console.log("not by ID — no need to copy any UUIDs from this output.");
}

main();
