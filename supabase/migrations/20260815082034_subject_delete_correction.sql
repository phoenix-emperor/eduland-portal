-- =====================================================================
-- Correction: subject deletion was originally teacher-scoped and a
-- pure cascade-delete (destroys teacher_assignments + scores
-- school-wide with no protection). This gave a single teacher more
-- destructive power than a plain admin has anywhere else in the
-- system. Fixing both halves of the problem:
--
-- 1. Only super_admin may delete a subject (mirrors class deletion).
-- 2. Subject deletion is now BLOCKED if the subject has any real
--    teacher_assignments or scores tied to it — same "protect real
--    history" philosophy already applied to classes and terms.
-- 3. Teachers keep a safe, narrow self-service action: removing
--    THEIR OWN assignment to a subject (not deleting the subject
--    itself, not affecting other teachers or any scores).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Change subject_id FKs from CASCADE to RESTRICT — a subject with
--    any active assignment or any recorded score can no longer be
--    deleted out from under that data.
-- ---------------------------------------------------------------------
alter table teacher_assignments drop constraint teacher_assignments_subject_id_fkey;
alter table teacher_assignments add constraint teacher_assignments_subject_id_fkey
  foreign key (subject_id) references subjects(id) on delete restrict;

alter table scores drop constraint scores_subject_id_fkey;
alter table scores add constraint scores_subject_id_fkey
  foreign key (subject_id) references subjects(id) on delete restrict;

-- ---------------------------------------------------------------------
-- 2. Replace the teacher-scoped delete policy with super_admin-only,
--    mirroring classes_super_admin_delete exactly.
-- ---------------------------------------------------------------------
drop policy if exists "subjects_teacher_delete" on subjects;
create policy "subjects_super_admin_delete" on subjects
  for delete using (
    school_id = my_school_id() and my_role() = 'super_admin'
  );

-- ---------------------------------------------------------------------
-- 3. New: a teacher may remove ONLY their own teacher_assignments
--    row — safe self-service ("I was assigned to this in error"),
--    with none of the blast radius of deleting the subject itself.
-- ---------------------------------------------------------------------
create policy "assignments_teacher_self_delete" on teacher_assignments
  for delete using (
    teacher_id = auth.uid()
  );