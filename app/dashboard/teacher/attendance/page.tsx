/**
 * @file app/dashboard/teacher/attendance/page.tsx
 * @description Server Component for Teacher Attendance Entry screen (CLASS-TEACHER-ONLY).
 * Fetches classes where the current teacher is designated as `classes.class_teacher_id`.
 */

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guard';
import AttendanceClient, {
  ClassTeacherClassItem,
  TermItemOption,
} from './AttendanceClient';

export default async function AttendancePage() {
  const { user, profile } = await requireRole(['teacher', 'admin', 'super_admin']);

  if (!profile?.school_id) {
    return (
      <div className="p-8 text-center text-red-800 bg-red-50 rounded-2xl border border-red-200">
        School ID not found for your account. Please contact system administrator.
      </div>
    );
  }

  const supabase = await createClient();

  // 1. Fetch designated classes for current teacher
  // CLASS-TEACHER-ONLY: Strictly query `classes.class_teacher_id = user.id` (not teacher_assignments)
  let classesQuery = supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', profile.school_id);

  if (profile.role === 'teacher') {
    classesQuery = classesQuery.eq('class_teacher_id', user.id);
  }

  const { data: rawClasses, error: classErr } = await classesQuery;

  if (classErr) {
    console.error('Error fetching designated teacher classes:', classErr);
  }

  const designatedClasses: ClassTeacherClassItem[] = (rawClasses || []).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // 2. Fetch terms for current school, ordered by created_at desc (most recent first)
  const { data: rawTerms, error: termErr } = await supabase
    .from('terms')
    .select('id, name, session, created_at')
    .eq('school_id', profile.school_id)
    .order('created_at', { ascending: false });

  if (termErr) {
    console.error('Error fetching school terms:', termErr);
  }

  const terms: TermItemOption[] = rawTerms || [];

  return <AttendanceClient classes={designatedClasses} terms={terms} />;
}
