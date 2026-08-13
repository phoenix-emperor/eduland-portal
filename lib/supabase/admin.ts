/**
 * @file lib/supabase/admin.ts
 * @description Privileged Supabase Admin Client using SUPABASE_SERVICE_ROLE_KEY.
 *
 * CRITICAL SECURITY WARNING:
 * This module uses the highly privileged Supabase Service Role Key which bypasses Row Level Security (RLS).
 * It MUST ONLY be imported and called inside SERVER-SIDE code (Server Actions or Server Components).
 * NEVER import or execute this module in client components or code bundled for the browser.
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types/database';

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL in environment variables.'
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
