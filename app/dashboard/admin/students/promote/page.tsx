import { requireRole } from '@/lib/auth/guard';
import { createClient } from '@/lib/supabase/server';
import PromoteStudentsClient from './PromoteStudentsClient';
import { ClassItem, StudentItem } from '@/lib/types/database';

export default async function PromoteStudentsPage() {
  const { profile } = await requireRole(['admin', 'super_admin']);
  const schoolId = profile?.school_id;

  const supabase = await createClient();

  // Fetch classes for school
  const { data: classesData } = await supabase
    .from('classes')
    .select('id, school_id, name, level, class_teacher_id, created_at')
    .eq('school_id', schoolId || '')
    .order('name', { ascending: true });

  // Fetch students for school
  const { data: studentsData } = await supabase
    .from('students')
    .select('*')
    .eq('school_id', schoolId || '')
    .order('full_name', { ascending: true });

  // Fetch terms for school to derive distinct sessions
  const { data: termsData } = await supabase
    .from('terms')
    .select('session')
    .eq('school_id', schoolId || '');

  const classes: ClassItem[] = classesData || [];
  const students: StudentItem[] = studentsData || [];
  const sessions: string[] = [
    ...new Set((termsData || []).map((t) => t.session)),
  ].sort();

  return (
    <PromoteStudentsClient
      classes={classes}
      students={students}
      sessions={sessions}
    />
  );
}
