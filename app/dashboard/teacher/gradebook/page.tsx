/**
 * @file app/dashboard/teacher/gradebook/page.tsx
 * @description Server Component for Teacher Gradebook Entry screen.
 * Fetches teacher's assigned classes and subjects, and active school terms.
 */

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guard';
import GradebookClient, {
  TeacherAssignmentItem,
  TermItemOption,
} from './GradebookClient';

export default async function GradebookPage() {
  const { user, profile } = await requireRole(['teacher', 'admin', 'super_admin']);

  if (!profile?.school_id) {
    return (
      <div className="p-8 text-center text-red-800 bg-red-50 rounded-2xl border border-red-200">
        School ID not found for your account. Please contact system administrator.
      </div>
    );
  }

  const supabase = await createClient();

  // 1. Fetch teacher assignments for current user & school
  // If role is teacher, restrict strictly to user.id; if admin/super_admin, fetch all school assignments
  let assignmentsQuery = supabase
    .from('teacher_assignments')
    .select(`
      id,
      class_id,
      subject_id,
      classes:class_id ( id, name ),
      subjects:subject_id ( id, name )
    `)
    .eq('school_id', profile.school_id);

  if (profile.role === 'teacher') {
    assignmentsQuery = assignmentsQuery.eq('teacher_id', user.id);
  }

  const { data: rawAssignments, error: assignErr } = await assignmentsQuery;

  if (assignErr) {
    console.error('Error fetching teacher assignments:', assignErr);
  }

  // Format assignments
  const assignments: TeacherAssignmentItem[] = (rawAssignments || [])
    .map((a: any) => {
      const cls = Array.isArray(a.classes) ? a.classes[0] : a.classes;
      const sub = Array.isArray(a.subjects) ? a.subjects[0] : a.subjects;
      return {
        id: a.id,
        class_id: a.class_id,
        class_name: cls?.name || 'Unknown Class',
        subject_id: a.subject_id,
        subject_name: sub?.name || 'Unknown Subject',
      };
    })
    .sort((a, b) => a.class_name.localeCompare(b.class_name));

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

  return <GradebookClient assignments={assignments} terms={terms} />;
}
