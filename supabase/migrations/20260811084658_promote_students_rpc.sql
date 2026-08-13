-- =====================================================================
-- 008: Atomic student promotion RPC
-- Replaces the two-separate-calls pattern in moveStudentsAction, which
-- silently failed to write enrollments (missing school_id) while still
-- reporting success and moving the student anyway.
-- =====================================================================

create or replace function promote_students(
  p_student_ids uuid[],
  p_old_class_id uuid,
  p_new_class_id uuid,
  p_term_id uuid,
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
  -- Both writes happen inside this one function call, which Postgres
  -- already runs as a single transaction. If either statement raises,
  -- the whole thing rolls back — no more "class moved but history lost."

  insert into enrollments (school_id, student_id, class_id, term_id)
  select p_school_id, sid, p_old_class_id, p_term_id
  from unnest(p_student_ids) as sid;

  update students
  set class_id = p_new_class_id
  where id = any(p_student_ids) and school_id = p_school_id;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;