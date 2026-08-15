-- =====================================================================
-- Demo data: 6 classes (Year 1-6), 5 students each, full current
-- session (First/Second/Third Term 2024/2025) of scores, attendance,
-- and general comments. Teachers and parents are looked up by EMAIL
-- (never a hardcoded UUID) — run seed-demo-accounts.mjs FIRST.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Classes (Year 1 already exists from Phase 1 seeding — skip it)
-- ---------------------------------------------------------------------
insert into classes (school_id, name, level)
select s.id, c.name, c.name
from schools s, (values ('Year 2'), ('Year 3'), ('Year 4'), ('Year 5'), ('Year 6')) as c(name)
where s.name = 'Eduland Schools'
on conflict (school_id, name) do nothing;

-- ---------------------------------------------------------------------
-- 2. Complete the current session: add First Term + Third Term
--    (Second Term 2024/2025 already exists from Phase 1)
-- ---------------------------------------------------------------------
insert into terms (school_id, session, name, next_term_begins)
select s.id, '2024/2025', t.name, t.next_begins
from schools s, (values
  ('First Term', null::date),
  ('Third Term', '2025-09-15'::date)
) as t(name, next_begins)
where s.name = 'Eduland Schools'
on conflict (school_id, session, name) do nothing;

-- ---------------------------------------------------------------------
-- 3. Students — 5 per class, 30 total
-- ---------------------------------------------------------------------
insert into students (school_id, class_id, full_name, admission_number, date_of_birth, gender, height_cm, weight_kg)
select s.id, c.id, d.full_name, d.admission_number, d.dob::date, d.gender, d.height_cm, d.weight_kg
from schools s
cross join (values
  ('Year 1','Aisha Bello','ES/2025/001','2019-03-14','female',112,19.5),
  ('Year 1','Oluwaseun Adekunle','ES/2025/002','2019-06-02','male',114,20.1),
  ('Year 1','Chiamaka Nwosu','ES/2025/003','2019-01-22','female',110,18.8),
  ('Year 1','Ibrahim Yusuf','ES/2025/004','2019-09-10','male',115,20.6),
  ('Year 1','Temitope Ogundele','ES/2025/005','2019-04-30','female',111,19.0),

  ('Year 2','Emeka Obi','ES/2025/006','2018-02-18','male',119,22.4),
  ('Year 2','Fatima Abdullahi','ES/2025/007','2018-07-05','female',117,21.9),
  ('Year 2','Adaeze Chukwu','ES/2025/008','2018-11-27','female',118,22.0),
  ('Year 2','Segun Afolabi','ES/2025/009','2018-05-14','male',120,22.8),
  ('Year 2','Blessing Eze','ES/2025/010','2018-09-09','female',116,21.5),

  ('Year 3','Chinedu Okoro','ES/2025/011','2017-01-12','male',124,25.3),
  ('Year 3','Amina Sani','ES/2025/012','2017-06-24','female',122,24.7),
  ('Year 3','Bimpe Alabi','ES/2025/013','2017-03-08','female',123,25.0),
  ('Year 3','Kelechi Nnamdi','ES/2025/014','2017-10-19','male',125,25.9),
  ('Year 3','Zainab Musa','ES/2025/015','2017-08-02','female',121,24.2),

  ('Year 4','Tobiloba Ogunleye','ES/2025/016','2016-02-26','male',130,28.6),
  ('Year 4','Ngozi Chukwuemeka','ES/2025/017','2016-05-15','female',128,27.9),
  ('Year 4','Yusuf Garba','ES/2025/018','2016-09-30','male',131,29.0),
  ('Year 4','Ifeoma Okafor','ES/2025/019','2016-12-03','female',129,28.2),
  ('Year 4','Damilola Adeyinka','ES/2025/020','2016-07-21','female',127,27.5),

  ('Year 5','Chukwuemeka Uzo','ES/2025/021','2015-01-09','male',136,32.4),
  ('Year 5','Halima Adamu','ES/2025/022','2015-04-17','female',134,31.6),
  ('Year 5','Adebayo Ojo','ES/2025/023','2015-08-28','male',137,32.9),
  ('Year 5','Nkechi Anyanwu','ES/2025/024','2015-11-11','female',133,31.0),
  ('Year 5','Faruk Aliyu','ES/2025/025','2015-06-06','male',135,32.0),

  ('Year 6','Oluwadamilare Bakare','ES/2025/026','2014-02-14','male',143,36.8),
  ('Year 6','Chiziterem Nwankwo','ES/2025/027','2014-05-23','female',141,35.9),
  ('Year 6','Rukayat Lawal','ES/2025/028','2014-09-16','female',140,35.4),
  ('Year 6','Emmanuel Etim','ES/2025/029','2014-12-01','male',144,37.2),
  ('Year 6','Precious Ibe','ES/2025/030','2014-07-08','female',142,36.1)
) as d(class_name, full_name, admission_number, dob, gender, height_cm, weight_kg)
join classes c on c.school_id = s.id and c.name = d.class_name
where s.name = 'Eduland Schools'
on conflict (school_id, admission_number) do nothing;

-- ---------------------------------------------------------------------
-- 4. Teacher assignments: each demo teacher is BOTH class teacher AND
--    subject teacher for 5 core subjects, for their own class
--    (realistic for a Nigerian primary school — class teachers
--    commonly teach most subjects to their own class)
-- ---------------------------------------------------------------------
do $$
declare
  v_school_id uuid;
  v_pairs record;
begin
  select id into v_school_id from schools where name = 'Eduland Schools';

  for v_pairs in
    select * from (values
      ('Year 1', 'fola.test@edulandschools.com'),
      ('Year 2', 'chidi.test@edulandschools.com'),
      ('Year 3', 'emeka.test@edulandschools.com'),
      ('Year 4', 'ngozi.test@edulandschools.com'),
      ('Year 5', 'tunde.test@edulandschools.com'),
      ('Year 6', 'aisha.test@edulandschools.com')
    ) as t(class_name, teacher_email)
  loop
    -- Set as class teacher
    update classes
    set class_teacher_id = (select id from auth.users where email = v_pairs.teacher_email)
    where school_id = v_school_id and name = v_pairs.class_name;

    -- Assign to 5 core subjects for their own class
    insert into teacher_assignments (school_id, teacher_id, class_id, subject_id)
    select
      v_school_id,
      (select id from auth.users where email = v_pairs.teacher_email),
      (select id from classes where school_id = v_school_id and name = v_pairs.class_name),
      sub.id
    from subjects sub
    where sub.school_id = v_school_id
      and sub.name in ('Numeracy', 'Literacy', 'Diction', 'Literature', 'Computer')
    on conflict (teacher_id, class_id, subject_id) do nothing;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 5. Scores — all students, 5 core subjects, all 3 terms of the
--    current session. Plausible randomized scores (10-20 per
--    component), entered by that class's teacher.
-- ---------------------------------------------------------------------
do $$
declare
  v_school_id uuid;
  v_student record;
  v_subject record;
  v_term record;
begin
  select id into v_school_id from schools where name = 'Eduland Schools';

  for v_student in
    select st.id as student_id, st.class_id, c.class_teacher_id
    from students st join classes c on c.id = st.class_id
    where st.school_id = v_school_id
  loop
    for v_subject in
      select id from subjects
      where school_id = v_school_id
        and name in ('Numeracy', 'Literacy', 'Diction', 'Literature', 'Computer')
    loop
      for v_term in
        select id from terms where school_id = v_school_id and session = '2024/2025'
      loop
        insert into scores (school_id, student_id, subject_id, term_id, hw, cw, test, entered_by)
        values (
          v_school_id,
          v_student.student_id,
          v_subject.id,
          v_term.id,
          floor(random() * 6 + 14)::numeric,  -- 14-19
          floor(random() * 6 + 14)::numeric,
          floor(random() * 6 + 14)::numeric,
          v_student.class_teacher_id
        )
        on conflict (student_id, subject_id, term_id) do nothing;
      end loop;
    end loop;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 6. Attendance — all students, all 3 terms. days_opened fixed per
--    term (schools count this once, same for the whole class);
--    days_present slightly randomized to look realistic.
-- ---------------------------------------------------------------------
do $$
declare
  v_school_id uuid;
  v_student record;
  v_term record;
  v_days_opened int;
begin
  select id into v_school_id from schools where name = 'Eduland Schools';

  for v_student in
    select st.id as student_id, c.class_teacher_id
    from students st join classes c on c.id = st.class_id
    where st.school_id = v_school_id
  loop
    for v_term in
      select id, name from terms where school_id = v_school_id and session = '2024/2025'
    loop
      v_days_opened := case v_term.name
        when 'First Term' then 55
        when 'Second Term' then 58
        else 60
      end;

      insert into attendance (school_id, student_id, term_id, days_opened, days_present)
      values (
        v_school_id,
        v_student.student_id,
        v_term.id,
        v_days_opened,
        v_days_opened - floor(random() * 5)::int  -- occasional absences
      )
      on conflict (student_id, term_id) do nothing;
    end loop;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 7. General comments — all students, all 3 terms. Cycles through a
--    small pool of varied, realistic comments.
-- ---------------------------------------------------------------------
do $$
declare
  v_school_id uuid;
  v_student record;
  v_term record;
  v_comments text[] := array[
    'A bright, attentive pupil who participates actively in class discussions.',
    'Shows steady improvement this term. Keep encouraging home practice.',
    'A hardworking pupil with a positive attitude towards learning.',
    'Performs well but needs to pay closer attention during lessons.',
    'An enthusiastic learner who works well with classmates.',
    'Has made good progress this term. Continue to build on this.',
    'A quiet but diligent pupil who completes all assignments on time.',
    'Shows strong potential; more consistent effort will improve results further.',
    'A confident pupil who enjoys helping others in class.',
    'Good overall performance this term. Well done.'
  ];
  v_counter int := 0;
begin
  select id into v_school_id from schools where name = 'Eduland Schools';

  for v_student in
    select st.id as student_id, c.class_teacher_id
    from students st join classes c on c.id = st.class_id
    where st.school_id = v_school_id
  loop
    for v_term in
      select id from terms where school_id = v_school_id and session = '2024/2025'
    loop
      insert into report_comments (school_id, student_id, term_id, general_comment, written_by)
      values (
        v_school_id,
        v_student.student_id,
        v_term.id,
        v_comments[(v_counter % array_length(v_comments, 1)) + 1],
        v_student.class_teacher_id
      )
      on conflict (student_id, term_id) do nothing;

      v_counter := v_counter + 1;
    end loop;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 8. Guardian links — 3 demo parents, some with siblings across
--    different classes
-- ---------------------------------------------------------------------
insert into guardians_students (guardian_id, student_id)
select (select id from auth.users where email = 'grace.test@edulandschools.com'), id
from students where admission_number in ('ES/2025/001', 'ES/2025/011')  -- Year 1 + Year 3 siblings
on conflict do nothing;

insert into guardians_students (guardian_id, student_id)
select (select id from auth.users where email = 'ibrahim.test@edulandschools.com'), id
from students where admission_number = 'ES/2025/016'  -- Year 4, only child
on conflict do nothing;

insert into guardians_students (guardian_id, student_id)
select (select id from auth.users where email = 'patience.test@edulandschools.com'), id
from students where admission_number in ('ES/2025/021', 'ES/2025/026')  -- Year 5 + Year 6 siblings
on conflict do nothing;