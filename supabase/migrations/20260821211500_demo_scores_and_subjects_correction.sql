-- =====================================================================
-- Migration 021: Demo/reference data update for corrected grading structure.
-- Sets head_of_school_name, adds 4 formal-name subjects, updates teacher
-- assignments for Year 4-6, and regenerates demo scores with ca (0-40)
-- and exam (0-60).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Set Head of School Name for Eduland Schools
--    TODO: Replace 'Dr. Mrs. A. B. Adeleke' with confirmed Head of School name if needed
-- ---------------------------------------------------------------------
update schools
set head_of_school_name = 'Dr. Mrs. A. B. Adeleke'
where name = 'Eduland Schools';

-- ---------------------------------------------------------------------
-- 2. Add 4 new formal-name subjects (Mathematics, English Language,
--    Literature in English, Basic Science) if they don't already exist
-- ---------------------------------------------------------------------
insert into subjects (school_id, name)
select s.id, sub.name
from schools s, (values
  ('Mathematics'),
  ('English Language'),
  ('Literature in English'),
  ('Basic Science')
) as sub(name)
where s.name = 'Eduland Schools'
on conflict (school_id, name) do nothing;

-- ---------------------------------------------------------------------
-- 3. Update teacher_assignments for Year 4, Year 5, Year 6 demo classes:
--    Use the formal-name subjects (Mathematics, English Language,
--    Literature in English, Basic Science) INSTEAD OF simple-name ones
--    (Numeracy, Literacy, Literature, Diction).
--    Year 1, Year 2, Year 3 keep simple names unchanged.
-- ---------------------------------------------------------------------
do $$
declare
  v_school_id uuid;
  v_class record;
begin
  select id into v_school_id from schools where name = 'Eduland Schools';

  -- For Year 4, Year 5, Year 6: remove old teacher assignments for simple-name subjects
  delete from teacher_assignments
  where school_id = v_school_id
    and class_id in (
      select id from classes where school_id = v_school_id and name in ('Year 4', 'Year 5', 'Year 6')
    )
    and subject_id in (
      select id from subjects where school_id = v_school_id and name in ('Numeracy', 'Literacy', 'Literature', 'Diction', 'Science')
    );

  -- Assign formal-name subjects (+ Computer) to Year 4, Year 5, Year 6 class teachers
  for v_class in
    select c.id as class_id, c.class_teacher_id
    from classes c
    where c.school_id = v_school_id and c.name in ('Year 4', 'Year 5', 'Year 6')
  loop
    insert into teacher_assignments (school_id, teacher_id, class_id, subject_id)
    select
      v_school_id,
      v_class.class_teacher_id,
      v_class.class_id,
      sub.id
    from subjects sub
    where sub.school_id = v_school_id
      and sub.name in ('Mathematics', 'English Language', 'Literature in English', 'Basic Science', 'Computer')
    on conflict (teacher_id, class_id, subject_id) do nothing;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 4. Regenerate demo scores for all 30 students across all 3 terms
--    (First/Second/Third, session 2024/2025) with new ca/exam structure:
--    - ca: random 25-40
--    - exam: random 35-60
--    - Year 1-3 use simple-name subjects (Numeracy, Literacy, Diction, Literature, Computer)
--    - Year 4-6 use formal-name subjects (Mathematics, English Language, Literature in English, Basic Science, Computer)
--    - entered_by = class teacher
-- ---------------------------------------------------------------------
do $$
declare
  v_school_id uuid;
  v_student record;
  v_subject record;
  v_term record;
  v_subject_names text[];
begin
  select id into v_school_id from schools where name = 'Eduland Schools';

  -- Wipe existing scores for a clean regeneration
  delete from scores where school_id = v_school_id;

  for v_student in
    select st.id as student_id, st.class_id, c.name as class_name, c.class_teacher_id
    from students st
    join classes c on c.id = st.class_id
    where st.school_id = v_school_id
  loop
    -- Determine subjects array based on class level
    if v_student.class_name in ('Year 1', 'Year 2', 'Year 3') then
      v_subject_names := array['Numeracy', 'Literacy', 'Diction', 'Literature', 'Computer'];
    else
      v_subject_names := array['Mathematics', 'English Language', 'Literature in English', 'Basic Science', 'Computer'];
    end if;

    for v_subject in
      select id from subjects
      where school_id = v_school_id
        and name = any(v_subject_names)
    loop
      for v_term in
        select id from terms where school_id = v_school_id and session = '2024/2025'
      loop
        insert into scores (
          school_id,
          student_id,
          subject_id,
          term_id,
          ca,
          exam,
          entered_by
        )
        values (
          v_school_id,
          v_student.student_id,
          v_subject.id,
          v_term.id,
          floor(random() * 16 + 25)::numeric, -- 25 to 40
          floor(random() * 26 + 35)::numeric, -- 35 to 60
          v_student.class_teacher_id
        )
        on conflict (student_id, subject_id, term_id) do update set
          ca = excluded.ca,
          exam = excluded.exam,
          entered_by = excluded.entered_by;
      end loop;
    end loop;
  end loop;
end $$;
