-- =====================================================================
-- Class teacher concept: one designated teacher per class, distinct
-- from subject assignments. Owns general comment, attendance, and
-- passport upload. Subject teachers keep entering their own scores
-- directly — unchanged.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. New column on classes
-- ---------------------------------------------------------------------
alter table classes add column class_teacher_id uuid references profiles(id) on delete set null;
create index idx_classes_class_teacher on classes(class_teacher_id);

-- ---------------------------------------------------------------------
-- 2. Helper functions
-- ---------------------------------------------------------------------
create or replace function is_class_teacher_of_class(p_class_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from classes c
    where c.id = p_class_id and c.class_teacher_id = auth.uid()
  );
$$;

create or replace function is_class_teacher_of_student(p_student_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from students s
    join classes c on c.id = s.class_id
    where s.id = p_student_id and c.class_teacher_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------
-- 3. Narrow attendance policies: was "any teacher assigned to any
--    subject in this class", now "the designated class teacher only"
-- ---------------------------------------------------------------------
drop policy if exists "attendance_teacher_select" on attendance;
create policy "attendance_teacher_select" on attendance
  for select using (
    my_role() = 'teacher' and is_class_teacher_of_student(attendance.student_id)
  );

drop policy if exists "attendance_teacher_write" on attendance;
create policy "attendance_teacher_write" on attendance
  for insert with check (
    my_role() = 'teacher' and is_class_teacher_of_student(attendance.student_id)
  );

drop policy if exists "attendance_teacher_update" on attendance;
create policy "attendance_teacher_update" on attendance
  for update using (
    my_role() = 'teacher' and is_class_teacher_of_student(attendance.student_id)
  );

-- ---------------------------------------------------------------------
-- 4. Narrow report_comments policies the same way
-- ---------------------------------------------------------------------
drop policy if exists "comments_teacher_select" on report_comments;
create policy "comments_teacher_select" on report_comments
  for select using (
    my_role() = 'teacher' and is_class_teacher_of_student(report_comments.student_id)
  );

drop policy if exists "comments_teacher_write" on report_comments;
create policy "comments_teacher_write" on report_comments
  for insert with check (
    my_role() = 'teacher' and is_class_teacher_of_student(report_comments.student_id)
  );

drop policy if exists "comments_teacher_update" on report_comments;
create policy "comments_teacher_update" on report_comments
  for update using (
    my_role() = 'teacher' and is_class_teacher_of_student(report_comments.student_id)
  );

-- ---------------------------------------------------------------------
-- 5. New: class teacher can update students (for passport upload).
--    Scoped by row via RLS; the application is responsible for only
--    sending passport_url in the update payload for this role — RLS
--    doesn't restrict which columns change, only which rows.
-- ---------------------------------------------------------------------
create policy "students_class_teacher_update" on students
  for update using (
    my_role() = 'teacher' and is_class_teacher_of_student(students.id)
  );