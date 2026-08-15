/**
 * @file app/dashboard/admin/students/page.tsx
 * @description Server component for Add & Manage Students in the Admin Dashboard.
 * Fetches school classes, students, parent profiles (with auth emails), guardian links,
 * and generates signed URLs for student passport photos stored in private 'passports' bucket.
 */

import { requireRole } from '@/lib/auth/guard';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import ManageStudentsClient, {
  StudentWithSignedUrl,
  ParentProfileOption,
  StudentGuardianLink,
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

  // 4. Fetch auth emails for parent user profile mapping
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
    console.error('Failed to list auth users for guardian email mapping:', err);
  }

  // 5. Fetch all parent profiles for this school
  const { data: parentProfilesRaw } = await (supabase.from('profiles') as any)
    .select('id, full_name, role')
    .eq('school_id', schoolId)
    .eq('role', 'parent')
    .order('full_name', { ascending: true });

  const parentProfiles: ParentProfileOption[] = (parentProfilesRaw || []).map(
    (p: any) => ({
      id: p.id,
      fullName: p.full_name,
      email: emailMap[p.id] || null,
    })
  );

  // 6. Fetch all guardian-student links
  const { data: guardianLinksRaw } = await (supabase.from('guardians_students') as any)
    .select(`
      guardian_id,
      student_id,
      profiles:guardian_id (
        id,
        full_name
      )
    `);

  const studentGuardianMap: Record<string, StudentGuardianLink[]> = {};

  if (guardianLinksRaw && Array.isArray(guardianLinksRaw)) {
    guardianLinksRaw.forEach((item: any) => {
      const gId = item.guardian_id;
      const sId = item.student_id;
      const pName = item.profiles?.full_name || 'Parent Account';

      if (sId && gId) {
        if (!studentGuardianMap[sId]) {
          studentGuardianMap[sId] = [];
        }
        studentGuardianMap[sId].push({
          guardianId: gId,
          studentId: sId,
          fullName: pName,
          email: emailMap[gId] || null,
        });
      }
    });
  }

  return (
    <ManageStudentsClient
      classes={classes}
      students={students}
      parentProfiles={parentProfiles}
      studentGuardianMap={studentGuardianMap}
    />
  );
}
