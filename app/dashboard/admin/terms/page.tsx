/**
 * @file app/dashboard/admin/terms/page.tsx
 * @description Server Component for Manage Academic Terms in the Admin Dashboard.
 * Fetches all academic terms for the school ordered by creation date desc.
 */

import { requireRole } from '@/lib/auth/guard';
import { createClient } from '@/lib/supabase/server';
import ManageTermsClient from './ManageTermsClient';
import { TermItem } from '@/lib/types/database';

export default async function ManageTermsPage() {
  const { profile } = await requireRole(['admin', 'super_admin']);
  const schoolId = profile?.school_id || '';

  const supabase = await createClient();

  // Fetch academic terms for the school ordered by most recent creation first
  const { data: termsRaw } = await (supabase.from('terms') as any)
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false });

  const terms: TermItem[] = (termsRaw || []) as TermItem[];

  return <ManageTermsClient terms={terms} />;
}
