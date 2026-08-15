/**
 * @file app/dashboard/teacher/subjects/page.tsx
 * @description Server Component for Teacher Subject Assignments screen (TEACHER-ONLY).
 * Fetches subject assignments assigned to the current teacher with assignment IDs for unassignment.
 */

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guard';
import TeacherSubjectsClient, {
  AssignedSubjectGroup,
} from './TeacherSubjectsClient';

export default async function TeacherSubjectsPage() {
  // TEACHER-ONLY: Strictly restricted to plain teacher role
  const { user, profile } = await requireRole(['teacher']);

  if (!profile?.school_id) {
    return (
      <div className="p-8 text-center text-red-800 bg-red-50 rounded-2xl border border-red-200">
        School ID not found for your account. Please contact system administrator.
      </div>
    );
  }

  const supabase = await createClient();

  // Fetch current teacher's own teacher_assignments joined with subjects and classes
  const { data: assignments, error: assignErr } = await supabase
    .from('teacher_assignments')
    .select(`
      id,
      subject_id,
      subjects:subject_id (id, name),
      classes:class_id (id, name)
    `)
    .eq('teacher_id', user.id)
    .eq('school_id', profile.school_id);

  if (assignErr) {
    console.error('Error fetching teacher subject assignments:', assignErr);
  }

  // Group assignments by subject_id
  const subjectMap: Record<
    string,
    {
      subjectId: string;
      subjectName: string;
      classes: { assignmentId: string; classId: string; className: string }[];
    }
  > = {};

  if (assignments && Array.isArray(assignments)) {
    assignments.forEach((item: any) => {
      const sub = item.subjects;
      const cls = item.classes;

      if (sub && sub.id && sub.name && item.id) {
        if (!subjectMap[sub.id]) {
          subjectMap[sub.id] = {
            subjectId: sub.id,
            subjectName: sub.name,
            classes: [],
          };
        }

        if (cls && cls.id && cls.name) {
          subjectMap[sub.id].classes.push({
            assignmentId: item.id,
            classId: cls.id,
            className: cls.name,
          });
        }
      }
    });
  }

  const assignedSubjects: AssignedSubjectGroup[] = Object.values(subjectMap)
    .map((sub) => ({
      subjectId: sub.subjectId,
      subjectName: sub.subjectName,
      classes: sub.classes.sort((a, b) => a.className.localeCompare(b.className)),
    }))
    .sort((a, b) => a.subjectName.localeCompare(b.subjectName));

  return <TeacherSubjectsClient assignedSubjects={assignedSubjects} />;
}
