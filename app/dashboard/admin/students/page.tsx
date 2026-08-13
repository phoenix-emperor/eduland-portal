/**
 * @file app/dashboard/admin/students/page.tsx
 * @description Server component for Add & Manage Students in the Admin Dashboard.
 * Fetches school classes, students, and generates signed URLs for student passport photos
 * stored in the private 'passports' storage bucket.
 */

import { requireRole } from '@/lib/auth/guard';
import { createClient } from '@/lib/supabase/server';
import ManageStudentsClient, {
  StudentWithSignedUrl,
} from './ManageStudentsClient';
import { ClassItem, StudentItem } from '@/lib/types/database';

export default async function ManageStudentsPage() {
  const { profile } = await requireRole(['admin', 'super_admin']);
  const schoolId = profile?.school_id || '';

  const supabase = await createClient();

  // 1. Fetch classes for school
  const { data: classesRaw } = await (supabase.from('classes') as any)
    .select('id, school_id, name, level, created_at')
    .eq('school_id', schoolId)
    .order('name', { ascending: true });

  const classes: ClassItem[] = (classesRaw || []) as ClassItem[];

  // 2. Fetch students for school
  const { data: studentsRaw } = await (supabase.from('students') as any)
    .select('*')
    .eq('school_id', schoolId)
    .order('full_name', { ascending: true });

  const studentsData: StudentItem[] = (studentsRaw || []) as StudentItem[];

  // 3. Generate signed URLs for passport photos stored in private 'passports' bucket
  const students: StudentWithSignedUrl[] = await Promise.all(
    studentsData.map(async (student) => {
      if (!student.passport_url) {
        return { ...student, signedPassportUrl: null };
      }

      // Generate signed URL (expires in 1 hour / 3600s)
      const { data: signedData } = await supabase.storage
        .from('passports')
        .createSignedUrl(student.passport_url, 3600);

      return {
        ...student,
        signedPassportUrl: signedData?.signedUrl || null,
      };
    })
  );

  return (
    <ManageStudentsClient
      classes={classes}
      students={students}
    />
  );
}
