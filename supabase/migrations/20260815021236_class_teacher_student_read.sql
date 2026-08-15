-- =====================================================================
-- Fix: a class teacher with no subject assignment in their own class
-- couldn't see the student roster at all. students_teacher_select
-- only covered subject-assigned teachers (via teacher_assigned_to_class,
-- which checks teacher_assignments). This was a gap left over from
-- the Phase 3 class-teacher migration (011) — attendance/comments/
-- passport-upload access were correctly scoped to class teachers, but
-- the underlying student READ access was never extended to match.
-- =====================================================================

create policy "students_class_teacher_select" on students
  for select using (
    my_role() = 'teacher' and is_class_teacher_of_class(students.class_id)
  );