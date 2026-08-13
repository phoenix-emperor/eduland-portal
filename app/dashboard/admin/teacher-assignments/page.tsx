/**
 * @file app/dashboard/admin/teacher-assignments/page.tsx
 * @description Server component for Manage Teacher Assignments in the Admin Dashboard.
 * Fetches classes, subjects, eligible teachers (role = 'teacher'), and existing assignments
 * scoped to the acting admin's school.
 */

import { requireRole } from '@/lib/auth/guard';
import { createClient } from '@/lib/supabase/server';
import ManageTeacherAssignmentsClient, {
  ClassWithTeacher,
  TeacherAssignmentPopulated,
} from './ManageTeacherAssignmentsClient';
import { ClassItem, SubjectItem, Profile } from '@/lib/types/database';

export default async function ManageTeacherAssignmentsPage() {
  const { profile } = await requireRole(['admin', 'super_admin']);
  const schoolId = profile?.school_id || '';

  const supabase = await createClient();

  // 1. Fetch classes scoped to school
  const { data: classesRaw } = await (supabase.from('classes') as any)
    .select('id, school_id, name, class_teacher_id, created_at')
    .eq('school_id', schoolId)
    .order('name', { ascending: true });

  const classesData = (classesRaw || []) as ClassItem[];

  // 2. Fetch subjects scoped to school
  const { data: subjectsRaw } = await (supabase.from('subjects') as any)
    .select('id, school_id, name, created_at')
    .eq('school_id', schoolId)
    .order('name', { ascending: true });

  const subjectsData = (subjectsRaw || []) as SubjectItem[];

  // 3. Fetch teachers (profiles where role = 'teacher' and school_id matches)
  const { data: teachersRaw } = await (supabase.from('profiles') as any)
    .select('id, school_id, role, full_name, avatar_url, created_at')
    .eq('school_id', schoolId)
    .eq('role', 'teacher')
    .order('full_name', { ascending: true });

  const teachersData = (teachersRaw || []) as Profile[];

  // Create lookup map for teacher names
  const teacherMap: Record<string, string> = {};
  teachersData.forEach((t) => {
    if (t.id && t.full_name) {
      teacherMap[t.id] = t.full_name;
    }
  });

  // Populate ClassWithTeacher items with classTeacherName
  const classes: ClassWithTeacher[] = classesData.map((c) => ({
    ...c,
    class_teacher_id: c.class_teacher_id || null,
    classTeacherName: c.class_teacher_id ? teacherMap[c.class_teacher_id] || null : null,
  }));

  // Create lookup maps for classes and subjects
  const classMap: Record<string, string> = {};
  classesData.forEach((c) => {
    if (c.id && c.name) classMap[c.id] = c.name;
  });

  const subjectMap: Record<string, string> = {};
  subjectsData.forEach((s) => {
    if (s.id && s.name) subjectMap[s.id] = s.name;
  });

  // 4. Fetch teacher_assignments scoped to school
  const { data: assignmentsRaw } = await (supabase.from('teacher_assignments') as any)
    .select('id, school_id, class_id, subject_id, teacher_id, created_at')
    .eq('school_id', schoolId);

  const assignmentsData = (assignmentsRaw || []) as {
    id: string;
    class_id: string;
    subject_id: string;
    teacher_id: string;
  }[];

  // Populate TeacherAssignmentPopulated items
  const assignments: TeacherAssignmentPopulated[] = assignmentsData.map((a) => ({
    id: a.id,
    class_id: a.class_id,
    subject_id: a.subject_id,
    teacher_id: a.teacher_id,
    className: classMap[a.class_id] || 'Unknown Class',
    subjectName: subjectMap[a.subject_id] || 'Unknown Subject',
    teacherName: teacherMap[a.teacher_id] || 'Unknown Teacher',
  }));

  return (
    <ManageTeacherAssignmentsClient
      classes={classes}
      subjects={subjectsData}
      teachers={teachersData}
      assignments={assignments}
    />
  );
}
