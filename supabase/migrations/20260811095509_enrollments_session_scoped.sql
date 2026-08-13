-- =====================================================================
-- Convert enrollments from per-term to per-session scoping.
-- A student's class doesn't change within a session (3 terms), so one
-- row per student per session is the correct unit — not one per term.
-- =====================================================================

-- 1. Add the new session column, backfilled from existing term_id rows
alter table enrollments add column session text;

update enrollments e
set session = t.session
from terms t
where t.id = e.term_id;

alter table enrollments alter column session set not null;

-- 2. Drop the old term-scoped unique constraint + term_id column,
--    add the new session-scoped unique constraint
alter table enrollments drop constraint enrollments_student_id_term_id_key;
alter table enrollments drop column term_id;
alter table enrollments add constraint enrollments_student_id_session_key unique (student_id, session);

-- Note: existing RLS policies on enrollments (enrollments_admin_all,
-- enrollments_teacher_select, enrollments_parent_select) reference
-- only student_id/class_id — no changes needed there.

-- 3. Replace promote_students to take a session (text) instead of a
--    term_id, matching the new schema. Same insert-or-update behavior,
--    now correctly modeling "one class per student per session."
--    IMPORTANT: changing a parameter's type (uuid -> text) means
--    `create or replace` would create a NEW overloaded function
--    instead of replacing the old one — drop the old signature first.
drop function if exists promote_students(uuid[], uuid, uuid, uuid, uuid);

create or replace function promote_students(
  p_student_ids uuid[],
  p_old_class_id uuid,
  p_new_class_id uuid,
  p_session text,
  p_school_id uuid
)
returns int
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_count int;
begin
  insert into enrollments (school_id, student_id, class_id, session)
  select p_school_id, sid, p_old_class_id, p_session
  from unnest(p_student_ids) as sid
  on conflict (student_id, session)
  do update set class_id = excluded.class_id, school_id = excluded.school_id;

  update students
  set class_id = p_new_class_id
  where id = any(p_student_ids) and school_id = p_school_id;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;