drop extension if exists "pg_net";

create type "public"."user_role" as enum ('parent', 'teacher', 'admin', 'super_admin');


  create table "public"."attendance" (
    "id" uuid not null default gen_random_uuid(),
    "school_id" uuid not null,
    "student_id" uuid not null,
    "term_id" uuid not null,
    "days_opened" integer not null default 0,
    "days_present" integer not null default 0
      );


alter table "public"."attendance" enable row level security;


  create table "public"."classes" (
    "id" uuid not null default gen_random_uuid(),
    "school_id" uuid not null,
    "name" text not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."classes" enable row level security;


  create table "public"."enrollments" (
    "id" uuid not null default gen_random_uuid(),
    "school_id" uuid not null,
    "student_id" uuid not null,
    "class_id" uuid not null,
    "term_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."enrollments" enable row level security;


  create table "public"."grading_keys" (
    "id" uuid not null default gen_random_uuid(),
    "school_id" uuid not null,
    "label" text not null,
    "grade_letter" text not null,
    "min_score" integer not null,
    "max_score" integer not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."grading_keys" enable row level security;


  create table "public"."guardians_students" (
    "guardian_id" uuid not null,
    "student_id" uuid not null
      );


alter table "public"."guardians_students" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "school_id" uuid not null,
    "role" public.user_role not null,
    "full_name" text not null,
    "avatar_url" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."profiles" enable row level security;


  create table "public"."report_comments" (
    "id" uuid not null default gen_random_uuid(),
    "school_id" uuid not null,
    "student_id" uuid not null,
    "term_id" uuid not null,
    "general_comment" text,
    "class_teacher_signature_url" text,
    "written_by" uuid,
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."report_comments" enable row level security;


  create table "public"."schools" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "address" text,
    "email" text,
    "website" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."schools" enable row level security;


  create table "public"."scores" (
    "id" uuid not null default gen_random_uuid(),
    "school_id" uuid not null,
    "student_id" uuid not null,
    "subject_id" uuid not null,
    "term_id" uuid not null,
    "hw" numeric(5,2) not null default 0,
    "cw" numeric(5,2) not null default 0,
    "test" numeric(5,2) not null default 0,
    "total" numeric(5,2) generated always as (((hw + cw) + test)) stored,
    "entered_by" uuid,
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."scores" enable row level security;


  create table "public"."students" (
    "id" uuid not null default gen_random_uuid(),
    "school_id" uuid not null,
    "class_id" uuid not null,
    "full_name" text not null,
    "passport_url" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."students" enable row level security;


  create table "public"."subjects" (
    "id" uuid not null default gen_random_uuid(),
    "school_id" uuid not null,
    "name" text not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."subjects" enable row level security;


  create table "public"."teacher_assignments" (
    "id" uuid not null default gen_random_uuid(),
    "school_id" uuid not null,
    "teacher_id" uuid not null,
    "class_id" uuid not null,
    "subject_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."teacher_assignments" enable row level security;


  create table "public"."terms" (
    "id" uuid not null default gen_random_uuid(),
    "school_id" uuid not null,
    "session" text not null,
    "name" text not null,
    "next_term_begins" date,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."terms" enable row level security;

CREATE UNIQUE INDEX attendance_pkey ON public.attendance USING btree (id);

CREATE UNIQUE INDEX attendance_student_id_term_id_key ON public.attendance USING btree (student_id, term_id);

CREATE UNIQUE INDEX classes_pkey ON public.classes USING btree (id);

CREATE UNIQUE INDEX classes_school_id_name_key ON public.classes USING btree (school_id, name);

CREATE UNIQUE INDEX enrollments_pkey ON public.enrollments USING btree (id);

CREATE UNIQUE INDEX enrollments_student_id_term_id_key ON public.enrollments USING btree (student_id, term_id);

CREATE UNIQUE INDEX grading_keys_pkey ON public.grading_keys USING btree (id);

CREATE UNIQUE INDEX guardians_students_pkey ON public.guardians_students USING btree (guardian_id, student_id);

CREATE INDEX idx_attendance_student_term ON public.attendance USING btree (student_id, term_id);

CREATE INDEX idx_comments_student_term ON public.report_comments USING btree (student_id, term_id);

CREATE INDEX idx_enrollments_class_term ON public.enrollments USING btree (class_id, term_id);

CREATE INDEX idx_enrollments_student ON public.enrollments USING btree (student_id);

CREATE INDEX idx_guardians_student ON public.guardians_students USING btree (student_id);

CREATE INDEX idx_profiles_school ON public.profiles USING btree (school_id);

CREATE INDEX idx_scores_student_term ON public.scores USING btree (student_id, term_id);

CREATE INDEX idx_scores_subject ON public.scores USING btree (subject_id);

CREATE INDEX idx_students_class ON public.students USING btree (class_id);

CREATE INDEX idx_students_school ON public.students USING btree (school_id);

CREATE INDEX idx_teacher_assignments_class_subject ON public.teacher_assignments USING btree (class_id, subject_id);

CREATE INDEX idx_teacher_assignments_teacher ON public.teacher_assignments USING btree (teacher_id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX report_comments_pkey ON public.report_comments USING btree (id);

CREATE UNIQUE INDEX report_comments_student_id_term_id_key ON public.report_comments USING btree (student_id, term_id);

CREATE UNIQUE INDEX schools_pkey ON public.schools USING btree (id);

CREATE UNIQUE INDEX scores_pkey ON public.scores USING btree (id);

CREATE UNIQUE INDEX scores_student_id_subject_id_term_id_key ON public.scores USING btree (student_id, subject_id, term_id);

CREATE UNIQUE INDEX students_pkey ON public.students USING btree (id);

CREATE UNIQUE INDEX subjects_pkey ON public.subjects USING btree (id);

CREATE UNIQUE INDEX subjects_school_id_name_key ON public.subjects USING btree (school_id, name);

CREATE UNIQUE INDEX teacher_assignments_pkey ON public.teacher_assignments USING btree (id);

CREATE UNIQUE INDEX teacher_assignments_teacher_id_class_id_subject_id_key ON public.teacher_assignments USING btree (teacher_id, class_id, subject_id);

CREATE UNIQUE INDEX terms_pkey ON public.terms USING btree (id);

CREATE UNIQUE INDEX terms_school_id_session_name_key ON public.terms USING btree (school_id, session, name);

alter table "public"."attendance" add constraint "attendance_pkey" PRIMARY KEY using index "attendance_pkey";

alter table "public"."classes" add constraint "classes_pkey" PRIMARY KEY using index "classes_pkey";

alter table "public"."enrollments" add constraint "enrollments_pkey" PRIMARY KEY using index "enrollments_pkey";

alter table "public"."grading_keys" add constraint "grading_keys_pkey" PRIMARY KEY using index "grading_keys_pkey";

alter table "public"."guardians_students" add constraint "guardians_students_pkey" PRIMARY KEY using index "guardians_students_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."report_comments" add constraint "report_comments_pkey" PRIMARY KEY using index "report_comments_pkey";

alter table "public"."schools" add constraint "schools_pkey" PRIMARY KEY using index "schools_pkey";

alter table "public"."scores" add constraint "scores_pkey" PRIMARY KEY using index "scores_pkey";

alter table "public"."students" add constraint "students_pkey" PRIMARY KEY using index "students_pkey";

alter table "public"."subjects" add constraint "subjects_pkey" PRIMARY KEY using index "subjects_pkey";

alter table "public"."teacher_assignments" add constraint "teacher_assignments_pkey" PRIMARY KEY using index "teacher_assignments_pkey";

alter table "public"."terms" add constraint "terms_pkey" PRIMARY KEY using index "terms_pkey";

alter table "public"."attendance" add constraint "attendance_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE not valid;

alter table "public"."attendance" validate constraint "attendance_school_id_fkey";

alter table "public"."attendance" add constraint "attendance_student_id_fkey" FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE not valid;

alter table "public"."attendance" validate constraint "attendance_student_id_fkey";

alter table "public"."attendance" add constraint "attendance_student_id_term_id_key" UNIQUE using index "attendance_student_id_term_id_key";

alter table "public"."attendance" add constraint "attendance_term_id_fkey" FOREIGN KEY (term_id) REFERENCES public.terms(id) ON DELETE CASCADE not valid;

alter table "public"."attendance" validate constraint "attendance_term_id_fkey";

alter table "public"."classes" add constraint "classes_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE not valid;

alter table "public"."classes" validate constraint "classes_school_id_fkey";

alter table "public"."classes" add constraint "classes_school_id_name_key" UNIQUE using index "classes_school_id_name_key";

alter table "public"."enrollments" add constraint "enrollments_class_id_fkey" FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE RESTRICT not valid;

alter table "public"."enrollments" validate constraint "enrollments_class_id_fkey";

alter table "public"."enrollments" add constraint "enrollments_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE not valid;

alter table "public"."enrollments" validate constraint "enrollments_school_id_fkey";

alter table "public"."enrollments" add constraint "enrollments_student_id_fkey" FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE not valid;

alter table "public"."enrollments" validate constraint "enrollments_student_id_fkey";

alter table "public"."enrollments" add constraint "enrollments_student_id_term_id_key" UNIQUE using index "enrollments_student_id_term_id_key";

alter table "public"."enrollments" add constraint "enrollments_term_id_fkey" FOREIGN KEY (term_id) REFERENCES public.terms(id) ON DELETE CASCADE not valid;

alter table "public"."enrollments" validate constraint "enrollments_term_id_fkey";

alter table "public"."grading_keys" add constraint "grading_keys_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE not valid;

alter table "public"."grading_keys" validate constraint "grading_keys_school_id_fkey";

alter table "public"."guardians_students" add constraint "guardians_students_guardian_id_fkey" FOREIGN KEY (guardian_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."guardians_students" validate constraint "guardians_students_guardian_id_fkey";

alter table "public"."guardians_students" add constraint "guardians_students_student_id_fkey" FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE not valid;

alter table "public"."guardians_students" validate constraint "guardians_students_student_id_fkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."profiles" add constraint "profiles_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_school_id_fkey";

alter table "public"."report_comments" add constraint "report_comments_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE not valid;

alter table "public"."report_comments" validate constraint "report_comments_school_id_fkey";

alter table "public"."report_comments" add constraint "report_comments_student_id_fkey" FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE not valid;

alter table "public"."report_comments" validate constraint "report_comments_student_id_fkey";

alter table "public"."report_comments" add constraint "report_comments_student_id_term_id_key" UNIQUE using index "report_comments_student_id_term_id_key";

alter table "public"."report_comments" add constraint "report_comments_term_id_fkey" FOREIGN KEY (term_id) REFERENCES public.terms(id) ON DELETE CASCADE not valid;

alter table "public"."report_comments" validate constraint "report_comments_term_id_fkey";

alter table "public"."report_comments" add constraint "report_comments_written_by_fkey" FOREIGN KEY (written_by) REFERENCES public.profiles(id) not valid;

alter table "public"."report_comments" validate constraint "report_comments_written_by_fkey";

alter table "public"."scores" add constraint "scores_entered_by_fkey" FOREIGN KEY (entered_by) REFERENCES public.profiles(id) not valid;

alter table "public"."scores" validate constraint "scores_entered_by_fkey";

alter table "public"."scores" add constraint "scores_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE not valid;

alter table "public"."scores" validate constraint "scores_school_id_fkey";

alter table "public"."scores" add constraint "scores_student_id_fkey" FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE not valid;

alter table "public"."scores" validate constraint "scores_student_id_fkey";

alter table "public"."scores" add constraint "scores_student_id_subject_id_term_id_key" UNIQUE using index "scores_student_id_subject_id_term_id_key";

alter table "public"."scores" add constraint "scores_subject_id_fkey" FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE not valid;

alter table "public"."scores" validate constraint "scores_subject_id_fkey";

alter table "public"."scores" add constraint "scores_term_id_fkey" FOREIGN KEY (term_id) REFERENCES public.terms(id) ON DELETE CASCADE not valid;

alter table "public"."scores" validate constraint "scores_term_id_fkey";

alter table "public"."students" add constraint "students_class_id_fkey" FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE RESTRICT not valid;

alter table "public"."students" validate constraint "students_class_id_fkey";

alter table "public"."students" add constraint "students_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE not valid;

alter table "public"."students" validate constraint "students_school_id_fkey";

alter table "public"."subjects" add constraint "subjects_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE not valid;

alter table "public"."subjects" validate constraint "subjects_school_id_fkey";

alter table "public"."subjects" add constraint "subjects_school_id_name_key" UNIQUE using index "subjects_school_id_name_key";

alter table "public"."teacher_assignments" add constraint "teacher_assignments_class_id_fkey" FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE not valid;

alter table "public"."teacher_assignments" validate constraint "teacher_assignments_class_id_fkey";

alter table "public"."teacher_assignments" add constraint "teacher_assignments_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE not valid;

alter table "public"."teacher_assignments" validate constraint "teacher_assignments_school_id_fkey";

alter table "public"."teacher_assignments" add constraint "teacher_assignments_subject_id_fkey" FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE not valid;

alter table "public"."teacher_assignments" validate constraint "teacher_assignments_subject_id_fkey";

alter table "public"."teacher_assignments" add constraint "teacher_assignments_teacher_id_class_id_subject_id_key" UNIQUE using index "teacher_assignments_teacher_id_class_id_subject_id_key";

alter table "public"."teacher_assignments" add constraint "teacher_assignments_teacher_id_fkey" FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."teacher_assignments" validate constraint "teacher_assignments_teacher_id_fkey";

alter table "public"."terms" add constraint "terms_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE not valid;

alter table "public"."terms" validate constraint "terms_school_id_fkey";

alter table "public"."terms" add constraint "terms_school_id_session_name_key" UNIQUE using index "terms_school_id_session_name_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into profiles (id, school_id, role, full_name)
  values (
    new.id,
    (select id from schools where name = 'Eduland Schools'),
    'parent',
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin_or_above()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select my_role() in ('admin', 'super_admin');
$function$
;

CREATE OR REPLACE FUNCTION public.is_guardian_of(p_student_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from guardians_students gs
    where gs.guardian_id = auth.uid() and gs.student_id = p_student_id
  );
$function$
;

CREATE OR REPLACE FUNCTION public.my_role()
 RETURNS public.user_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select role from profiles where id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.my_school_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select school_id from profiles where id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.promote_students(p_student_ids uuid[], p_old_class_id uuid, p_new_class_id uuid, p_term_id uuid, p_school_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.student_school_id(p_student_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select school_id from students where id = p_student_id;
$function$
;

CREATE OR REPLACE FUNCTION public.teacher_assigned_to_class(p_class_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from teacher_assignments ta
    where ta.teacher_id = auth.uid() and ta.class_id = p_class_id
  );
$function$
;

CREATE OR REPLACE FUNCTION public.teacher_assigned_to_student(p_student_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from students s
    join teacher_assignments ta on ta.class_id = s.class_id
    where s.id = p_student_id and ta.teacher_id = auth.uid()
  );
$function$
;

CREATE OR REPLACE FUNCTION public.teacher_assigned_to_student_subject(p_student_id uuid, p_subject_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from students s
    join teacher_assignments ta on ta.class_id = s.class_id
    where s.id = p_student_id
      and ta.subject_id = p_subject_id
      and ta.teacher_id = auth.uid()
  );
$function$
;

CREATE OR REPLACE FUNCTION public.teacher_has_assignment(p_class_id uuid, p_subject_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from teacher_assignments ta
    where ta.teacher_id = auth.uid()
      and ta.class_id = p_class_id
      and ta.subject_id = p_subject_id
  );
$function$
;

CREATE OR REPLACE FUNCTION public.teacher_teaches_subject(p_subject_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from teacher_assignments ta
    where ta.teacher_id = auth.uid() and ta.subject_id = p_subject_id
  );
$function$
;

grant delete on table "public"."attendance" to "anon";

grant insert on table "public"."attendance" to "anon";

grant references on table "public"."attendance" to "anon";

grant select on table "public"."attendance" to "anon";

grant trigger on table "public"."attendance" to "anon";

grant truncate on table "public"."attendance" to "anon";

grant update on table "public"."attendance" to "anon";

grant delete on table "public"."attendance" to "authenticated";

grant insert on table "public"."attendance" to "authenticated";

grant references on table "public"."attendance" to "authenticated";

grant select on table "public"."attendance" to "authenticated";

grant trigger on table "public"."attendance" to "authenticated";

grant truncate on table "public"."attendance" to "authenticated";

grant update on table "public"."attendance" to "authenticated";

grant delete on table "public"."attendance" to "service_role";

grant insert on table "public"."attendance" to "service_role";

grant references on table "public"."attendance" to "service_role";

grant select on table "public"."attendance" to "service_role";

grant trigger on table "public"."attendance" to "service_role";

grant truncate on table "public"."attendance" to "service_role";

grant update on table "public"."attendance" to "service_role";

grant delete on table "public"."classes" to "anon";

grant insert on table "public"."classes" to "anon";

grant references on table "public"."classes" to "anon";

grant select on table "public"."classes" to "anon";

grant trigger on table "public"."classes" to "anon";

grant truncate on table "public"."classes" to "anon";

grant update on table "public"."classes" to "anon";

grant delete on table "public"."classes" to "authenticated";

grant insert on table "public"."classes" to "authenticated";

grant references on table "public"."classes" to "authenticated";

grant select on table "public"."classes" to "authenticated";

grant trigger on table "public"."classes" to "authenticated";

grant truncate on table "public"."classes" to "authenticated";

grant update on table "public"."classes" to "authenticated";

grant delete on table "public"."classes" to "service_role";

grant insert on table "public"."classes" to "service_role";

grant references on table "public"."classes" to "service_role";

grant select on table "public"."classes" to "service_role";

grant trigger on table "public"."classes" to "service_role";

grant truncate on table "public"."classes" to "service_role";

grant update on table "public"."classes" to "service_role";

grant delete on table "public"."enrollments" to "anon";

grant insert on table "public"."enrollments" to "anon";

grant references on table "public"."enrollments" to "anon";

grant select on table "public"."enrollments" to "anon";

grant trigger on table "public"."enrollments" to "anon";

grant truncate on table "public"."enrollments" to "anon";

grant update on table "public"."enrollments" to "anon";

grant delete on table "public"."enrollments" to "authenticated";

grant insert on table "public"."enrollments" to "authenticated";

grant references on table "public"."enrollments" to "authenticated";

grant select on table "public"."enrollments" to "authenticated";

grant trigger on table "public"."enrollments" to "authenticated";

grant truncate on table "public"."enrollments" to "authenticated";

grant update on table "public"."enrollments" to "authenticated";

grant delete on table "public"."enrollments" to "service_role";

grant insert on table "public"."enrollments" to "service_role";

grant references on table "public"."enrollments" to "service_role";

grant select on table "public"."enrollments" to "service_role";

grant trigger on table "public"."enrollments" to "service_role";

grant truncate on table "public"."enrollments" to "service_role";

grant update on table "public"."enrollments" to "service_role";

grant delete on table "public"."grading_keys" to "anon";

grant insert on table "public"."grading_keys" to "anon";

grant references on table "public"."grading_keys" to "anon";

grant select on table "public"."grading_keys" to "anon";

grant trigger on table "public"."grading_keys" to "anon";

grant truncate on table "public"."grading_keys" to "anon";

grant update on table "public"."grading_keys" to "anon";

grant delete on table "public"."grading_keys" to "authenticated";

grant insert on table "public"."grading_keys" to "authenticated";

grant references on table "public"."grading_keys" to "authenticated";

grant select on table "public"."grading_keys" to "authenticated";

grant trigger on table "public"."grading_keys" to "authenticated";

grant truncate on table "public"."grading_keys" to "authenticated";

grant update on table "public"."grading_keys" to "authenticated";

grant delete on table "public"."grading_keys" to "service_role";

grant insert on table "public"."grading_keys" to "service_role";

grant references on table "public"."grading_keys" to "service_role";

grant select on table "public"."grading_keys" to "service_role";

grant trigger on table "public"."grading_keys" to "service_role";

grant truncate on table "public"."grading_keys" to "service_role";

grant update on table "public"."grading_keys" to "service_role";

grant delete on table "public"."guardians_students" to "anon";

grant insert on table "public"."guardians_students" to "anon";

grant references on table "public"."guardians_students" to "anon";

grant select on table "public"."guardians_students" to "anon";

grant trigger on table "public"."guardians_students" to "anon";

grant truncate on table "public"."guardians_students" to "anon";

grant update on table "public"."guardians_students" to "anon";

grant delete on table "public"."guardians_students" to "authenticated";

grant insert on table "public"."guardians_students" to "authenticated";

grant references on table "public"."guardians_students" to "authenticated";

grant select on table "public"."guardians_students" to "authenticated";

grant trigger on table "public"."guardians_students" to "authenticated";

grant truncate on table "public"."guardians_students" to "authenticated";

grant update on table "public"."guardians_students" to "authenticated";

grant delete on table "public"."guardians_students" to "service_role";

grant insert on table "public"."guardians_students" to "service_role";

grant references on table "public"."guardians_students" to "service_role";

grant select on table "public"."guardians_students" to "service_role";

grant trigger on table "public"."guardians_students" to "service_role";

grant truncate on table "public"."guardians_students" to "service_role";

grant update on table "public"."guardians_students" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."report_comments" to "anon";

grant insert on table "public"."report_comments" to "anon";

grant references on table "public"."report_comments" to "anon";

grant select on table "public"."report_comments" to "anon";

grant trigger on table "public"."report_comments" to "anon";

grant truncate on table "public"."report_comments" to "anon";

grant update on table "public"."report_comments" to "anon";

grant delete on table "public"."report_comments" to "authenticated";

grant insert on table "public"."report_comments" to "authenticated";

grant references on table "public"."report_comments" to "authenticated";

grant select on table "public"."report_comments" to "authenticated";

grant trigger on table "public"."report_comments" to "authenticated";

grant truncate on table "public"."report_comments" to "authenticated";

grant update on table "public"."report_comments" to "authenticated";

grant delete on table "public"."report_comments" to "service_role";

grant insert on table "public"."report_comments" to "service_role";

grant references on table "public"."report_comments" to "service_role";

grant select on table "public"."report_comments" to "service_role";

grant trigger on table "public"."report_comments" to "service_role";

grant truncate on table "public"."report_comments" to "service_role";

grant update on table "public"."report_comments" to "service_role";

grant delete on table "public"."schools" to "anon";

grant insert on table "public"."schools" to "anon";

grant references on table "public"."schools" to "anon";

grant select on table "public"."schools" to "anon";

grant trigger on table "public"."schools" to "anon";

grant truncate on table "public"."schools" to "anon";

grant update on table "public"."schools" to "anon";

grant delete on table "public"."schools" to "authenticated";

grant insert on table "public"."schools" to "authenticated";

grant references on table "public"."schools" to "authenticated";

grant select on table "public"."schools" to "authenticated";

grant trigger on table "public"."schools" to "authenticated";

grant truncate on table "public"."schools" to "authenticated";

grant update on table "public"."schools" to "authenticated";

grant delete on table "public"."schools" to "service_role";

grant insert on table "public"."schools" to "service_role";

grant references on table "public"."schools" to "service_role";

grant select on table "public"."schools" to "service_role";

grant trigger on table "public"."schools" to "service_role";

grant truncate on table "public"."schools" to "service_role";

grant update on table "public"."schools" to "service_role";

grant delete on table "public"."scores" to "anon";

grant insert on table "public"."scores" to "anon";

grant references on table "public"."scores" to "anon";

grant select on table "public"."scores" to "anon";

grant trigger on table "public"."scores" to "anon";

grant truncate on table "public"."scores" to "anon";

grant update on table "public"."scores" to "anon";

grant delete on table "public"."scores" to "authenticated";

grant insert on table "public"."scores" to "authenticated";

grant references on table "public"."scores" to "authenticated";

grant select on table "public"."scores" to "authenticated";

grant trigger on table "public"."scores" to "authenticated";

grant truncate on table "public"."scores" to "authenticated";

grant update on table "public"."scores" to "authenticated";

grant delete on table "public"."scores" to "service_role";

grant insert on table "public"."scores" to "service_role";

grant references on table "public"."scores" to "service_role";

grant select on table "public"."scores" to "service_role";

grant trigger on table "public"."scores" to "service_role";

grant truncate on table "public"."scores" to "service_role";

grant update on table "public"."scores" to "service_role";

grant delete on table "public"."students" to "anon";

grant insert on table "public"."students" to "anon";

grant references on table "public"."students" to "anon";

grant select on table "public"."students" to "anon";

grant trigger on table "public"."students" to "anon";

grant truncate on table "public"."students" to "anon";

grant update on table "public"."students" to "anon";

grant delete on table "public"."students" to "authenticated";

grant insert on table "public"."students" to "authenticated";

grant references on table "public"."students" to "authenticated";

grant select on table "public"."students" to "authenticated";

grant trigger on table "public"."students" to "authenticated";

grant truncate on table "public"."students" to "authenticated";

grant update on table "public"."students" to "authenticated";

grant delete on table "public"."students" to "service_role";

grant insert on table "public"."students" to "service_role";

grant references on table "public"."students" to "service_role";

grant select on table "public"."students" to "service_role";

grant trigger on table "public"."students" to "service_role";

grant truncate on table "public"."students" to "service_role";

grant update on table "public"."students" to "service_role";

grant delete on table "public"."subjects" to "anon";

grant insert on table "public"."subjects" to "anon";

grant references on table "public"."subjects" to "anon";

grant select on table "public"."subjects" to "anon";

grant trigger on table "public"."subjects" to "anon";

grant truncate on table "public"."subjects" to "anon";

grant update on table "public"."subjects" to "anon";

grant delete on table "public"."subjects" to "authenticated";

grant insert on table "public"."subjects" to "authenticated";

grant references on table "public"."subjects" to "authenticated";

grant select on table "public"."subjects" to "authenticated";

grant trigger on table "public"."subjects" to "authenticated";

grant truncate on table "public"."subjects" to "authenticated";

grant update on table "public"."subjects" to "authenticated";

grant delete on table "public"."subjects" to "service_role";

grant insert on table "public"."subjects" to "service_role";

grant references on table "public"."subjects" to "service_role";

grant select on table "public"."subjects" to "service_role";

grant trigger on table "public"."subjects" to "service_role";

grant truncate on table "public"."subjects" to "service_role";

grant update on table "public"."subjects" to "service_role";

grant delete on table "public"."teacher_assignments" to "anon";

grant insert on table "public"."teacher_assignments" to "anon";

grant references on table "public"."teacher_assignments" to "anon";

grant select on table "public"."teacher_assignments" to "anon";

grant trigger on table "public"."teacher_assignments" to "anon";

grant truncate on table "public"."teacher_assignments" to "anon";

grant update on table "public"."teacher_assignments" to "anon";

grant delete on table "public"."teacher_assignments" to "authenticated";

grant insert on table "public"."teacher_assignments" to "authenticated";

grant references on table "public"."teacher_assignments" to "authenticated";

grant select on table "public"."teacher_assignments" to "authenticated";

grant trigger on table "public"."teacher_assignments" to "authenticated";

grant truncate on table "public"."teacher_assignments" to "authenticated";

grant update on table "public"."teacher_assignments" to "authenticated";

grant delete on table "public"."teacher_assignments" to "service_role";

grant insert on table "public"."teacher_assignments" to "service_role";

grant references on table "public"."teacher_assignments" to "service_role";

grant select on table "public"."teacher_assignments" to "service_role";

grant trigger on table "public"."teacher_assignments" to "service_role";

grant truncate on table "public"."teacher_assignments" to "service_role";

grant update on table "public"."teacher_assignments" to "service_role";

grant delete on table "public"."terms" to "anon";

grant insert on table "public"."terms" to "anon";

grant references on table "public"."terms" to "anon";

grant select on table "public"."terms" to "anon";

grant trigger on table "public"."terms" to "anon";

grant truncate on table "public"."terms" to "anon";

grant update on table "public"."terms" to "anon";

grant delete on table "public"."terms" to "authenticated";

grant insert on table "public"."terms" to "authenticated";

grant references on table "public"."terms" to "authenticated";

grant select on table "public"."terms" to "authenticated";

grant trigger on table "public"."terms" to "authenticated";

grant truncate on table "public"."terms" to "authenticated";

grant update on table "public"."terms" to "authenticated";

grant delete on table "public"."terms" to "service_role";

grant insert on table "public"."terms" to "service_role";

grant references on table "public"."terms" to "service_role";

grant select on table "public"."terms" to "service_role";

grant trigger on table "public"."terms" to "service_role";

grant truncate on table "public"."terms" to "service_role";

grant update on table "public"."terms" to "service_role";


  create policy "attendance_admin_all"
  on "public"."attendance"
  as permissive
  for all
  to public
using (((school_id = public.my_school_id()) AND public.is_admin_or_above()));



  create policy "attendance_parent_select"
  on "public"."attendance"
  as permissive
  for select
  to public
using (((public.my_role() = 'parent'::public.user_role) AND public.is_guardian_of(student_id)));



  create policy "attendance_teacher_select"
  on "public"."attendance"
  as permissive
  for select
  to public
using (((public.my_role() = 'teacher'::public.user_role) AND public.teacher_assigned_to_student(student_id)));



  create policy "attendance_teacher_update"
  on "public"."attendance"
  as permissive
  for update
  to public
using (((public.my_role() = 'teacher'::public.user_role) AND public.teacher_assigned_to_student(student_id)));



  create policy "attendance_teacher_write"
  on "public"."attendance"
  as permissive
  for insert
  to public
with check (((public.my_role() = 'teacher'::public.user_role) AND public.teacher_assigned_to_student(student_id)));



  create policy "classes_admin_update"
  on "public"."classes"
  as permissive
  for update
  to public
using (((school_id = public.my_school_id()) AND public.is_admin_or_above()));



  create policy "classes_admin_write"
  on "public"."classes"
  as permissive
  for insert
  to public
with check (((school_id = public.my_school_id()) AND public.is_admin_or_above()));



  create policy "classes_select"
  on "public"."classes"
  as permissive
  for select
  to public
using ((school_id = public.my_school_id()));



  create policy "classes_super_admin_delete"
  on "public"."classes"
  as permissive
  for delete
  to public
using (((school_id = public.my_school_id()) AND (public.my_role() = 'super_admin'::public.user_role)));



  create policy "enrollments_admin_all"
  on "public"."enrollments"
  as permissive
  for all
  to public
using (((school_id = public.my_school_id()) AND public.is_admin_or_above()));



  create policy "enrollments_parent_select"
  on "public"."enrollments"
  as permissive
  for select
  to public
using (((public.my_role() = 'parent'::public.user_role) AND public.is_guardian_of(student_id)));



  create policy "enrollments_teacher_select"
  on "public"."enrollments"
  as permissive
  for select
  to public
using (((public.my_role() = 'teacher'::public.user_role) AND public.teacher_assigned_to_class(class_id)));



  create policy "grading_keys_admin_update"
  on "public"."grading_keys"
  as permissive
  for update
  to public
using (((school_id = public.my_school_id()) AND public.is_admin_or_above()));



  create policy "grading_keys_admin_write"
  on "public"."grading_keys"
  as permissive
  for insert
  to public
with check (((school_id = public.my_school_id()) AND public.is_admin_or_above()));



  create policy "grading_keys_select"
  on "public"."grading_keys"
  as permissive
  for select
  to public
using ((school_id = public.my_school_id()));



  create policy "guardians_admin_manage"
  on "public"."guardians_students"
  as permissive
  for all
  to public
using ((public.is_admin_or_above() AND (public.student_school_id(student_id) = public.my_school_id())));



  create policy "guardians_select_self"
  on "public"."guardians_students"
  as permissive
  for select
  to public
using ((guardian_id = auth.uid()));



  create policy "profiles_admin_manage"
  on "public"."profiles"
  as permissive
  for all
  to public
using (((school_id = public.my_school_id()) AND public.is_admin_or_above()));



  create policy "profiles_select_same_school_staff"
  on "public"."profiles"
  as permissive
  for select
  to public
using (((school_id = public.my_school_id()) AND public.is_admin_or_above()));



  create policy "profiles_select_self"
  on "public"."profiles"
  as permissive
  for select
  to public
using ((id = auth.uid()));



  create policy "profiles_update_self"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((id = auth.uid()));



  create policy "comments_admin_all"
  on "public"."report_comments"
  as permissive
  for all
  to public
using (((school_id = public.my_school_id()) AND public.is_admin_or_above()));



  create policy "comments_parent_select"
  on "public"."report_comments"
  as permissive
  for select
  to public
using (((public.my_role() = 'parent'::public.user_role) AND public.is_guardian_of(student_id)));



  create policy "comments_teacher_select"
  on "public"."report_comments"
  as permissive
  for select
  to public
using (((public.my_role() = 'teacher'::public.user_role) AND public.teacher_assigned_to_student(student_id)));



  create policy "comments_teacher_update"
  on "public"."report_comments"
  as permissive
  for update
  to public
using (((public.my_role() = 'teacher'::public.user_role) AND public.teacher_assigned_to_student(student_id)));



  create policy "comments_teacher_write"
  on "public"."report_comments"
  as permissive
  for insert
  to public
with check (((public.my_role() = 'teacher'::public.user_role) AND public.teacher_assigned_to_student(student_id)));



  create policy "schools_select_own"
  on "public"."schools"
  as permissive
  for select
  to public
using ((id = public.my_school_id()));



  create policy "schools_update_super_admin"
  on "public"."schools"
  as permissive
  for update
  to public
using ((public.my_role() = 'super_admin'::public.user_role));



  create policy "scores_admin_all"
  on "public"."scores"
  as permissive
  for all
  to public
using (((school_id = public.my_school_id()) AND public.is_admin_or_above()));



  create policy "scores_parent_select"
  on "public"."scores"
  as permissive
  for select
  to public
using (((public.my_role() = 'parent'::public.user_role) AND public.is_guardian_of(student_id)));



  create policy "scores_teacher_select"
  on "public"."scores"
  as permissive
  for select
  to public
using (((public.my_role() = 'teacher'::public.user_role) AND public.teacher_assigned_to_student_subject(student_id, subject_id)));



  create policy "scores_teacher_update"
  on "public"."scores"
  as permissive
  for update
  to public
using (((public.my_role() = 'teacher'::public.user_role) AND public.teacher_assigned_to_student_subject(student_id, subject_id)));



  create policy "scores_teacher_write"
  on "public"."scores"
  as permissive
  for insert
  to public
with check (((public.my_role() = 'teacher'::public.user_role) AND public.teacher_assigned_to_student_subject(student_id, subject_id)));



  create policy "students_admin_all"
  on "public"."students"
  as permissive
  for all
  to public
using (((school_id = public.my_school_id()) AND public.is_admin_or_above()));



  create policy "students_parent_select"
  on "public"."students"
  as permissive
  for select
  to public
using (((public.my_role() = 'parent'::public.user_role) AND public.is_guardian_of(id)));



  create policy "students_teacher_select"
  on "public"."students"
  as permissive
  for select
  to public
using (((school_id = public.my_school_id()) AND (public.my_role() = 'teacher'::public.user_role) AND public.teacher_assigned_to_class(class_id)));



  create policy "subjects_admin_update"
  on "public"."subjects"
  as permissive
  for update
  to public
using (((school_id = public.my_school_id()) AND public.is_admin_or_above()));



  create policy "subjects_admin_write"
  on "public"."subjects"
  as permissive
  for insert
  to public
with check (((school_id = public.my_school_id()) AND public.is_admin_or_above()));



  create policy "subjects_select"
  on "public"."subjects"
  as permissive
  for select
  to public
using ((school_id = public.my_school_id()));



  create policy "subjects_teacher_delete"
  on "public"."subjects"
  as permissive
  for delete
  to public
using (((school_id = public.my_school_id()) AND (public.my_role() = 'teacher'::public.user_role) AND public.teacher_teaches_subject(id)));



  create policy "assignments_admin_delete"
  on "public"."teacher_assignments"
  as permissive
  for delete
  to public
using (((school_id = public.my_school_id()) AND public.is_admin_or_above()));



  create policy "assignments_admin_update"
  on "public"."teacher_assignments"
  as permissive
  for update
  to public
using (((school_id = public.my_school_id()) AND public.is_admin_or_above()));



  create policy "assignments_admin_write"
  on "public"."teacher_assignments"
  as permissive
  for insert
  to public
with check (((school_id = public.my_school_id()) AND public.is_admin_or_above()));



  create policy "assignments_select_own_or_admin"
  on "public"."teacher_assignments"
  as permissive
  for select
  to public
using (((school_id = public.my_school_id()) AND ((teacher_id = auth.uid()) OR public.is_admin_or_above())));



  create policy "terms_admin_update"
  on "public"."terms"
  as permissive
  for update
  to public
using (((school_id = public.my_school_id()) AND public.is_admin_or_above()));



  create policy "terms_admin_write"
  on "public"."terms"
  as permissive
  for insert
  to public
with check (((school_id = public.my_school_id()) AND public.is_admin_or_above()));



  create policy "terms_select"
  on "public"."terms"
  as permissive
  for select
  to public
using ((school_id = public.my_school_id()));


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();


