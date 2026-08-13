import { requireRole } from '@/lib/auth/guard';
import { createClient } from '@/lib/supabase/server';
import ManageClassesSubjectsClient, {
  ClassWithCount,
  SubjectWithCount,
} from './ManageClassesSubjectsClient';
import { ClassItem, SubjectItem } from '@/lib/types/database';

export default async function ManageClassesSubjectsPage() {
  const { profile } = await requireRole(['admin', 'super_admin']);
  const schoolId = profile?.school_id || '';

  const supabase = await createClient();

  // Fetch classes scoped to school
  const { data: classesRaw } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', schoolId)
    .order('name', { ascending: true });

  const classesData = (classesRaw || []) as Pick<ClassItem, 'id' | 'name'>[];

  // Fetch student counts per class
  const { data: studentsRaw } = await supabase
    .from('students')
    .select('class_id')
    .eq('school_id', schoolId);

  const studentsData = (studentsRaw || []) as { class_id: string | null }[];

  const studentCountMap: Record<string, number> = {};
  studentsData.forEach((s) => {
    if (s.class_id) {
      studentCountMap[s.class_id] = (studentCountMap[s.class_id] || 0) + 1;
    }
  });

  const classes: ClassWithCount[] = classesData.map((c) => ({
    id: c.id,
    name: c.name,
    studentCount: studentCountMap[c.id] || 0,
  }));

  // Fetch subjects scoped to school
  const { data: subjectsRaw } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('school_id', schoolId)
    .order('name', { ascending: true });

  const subjectsData = (subjectsRaw || []) as Pick<SubjectItem, 'id' | 'name'>[];

  // Fetch teacher assignment counts per subject
  const { data: assignmentsRaw } = await supabase
    .from('teacher_assignments')
    .select('subject_id')
    .eq('school_id', schoolId);

  const assignmentsData = (assignmentsRaw || []) as { subject_id: string }[];

  const assignmentCountMap: Record<string, number> = {};
  assignmentsData.forEach((a) => {
    if (a.subject_id) {
      assignmentCountMap[a.subject_id] = (assignmentCountMap[a.subject_id] || 0) + 1;
    }
  });

  const subjects: SubjectWithCount[] = subjectsData.map((s) => ({
    id: s.id,
    name: s.name,
    assignmentCount: assignmentCountMap[s.id] || 0,
  }));

  return (
    <ManageClassesSubjectsClient
      initialClasses={classes}
      initialSubjects={subjects}
      userRole={profile?.role || 'admin'}
    />
  );
}
