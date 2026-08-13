-- =====================================================================
-- Passport photo storage: private bucket, hard size/type limits at the
-- storage layer (frontend limits alone can be bypassed), RLS policies
-- mirroring the same guardian/class-teacher/admin access already used
-- for the students table.
--
-- Path convention: every object is stored as `<student_id>/<filename>`
-- so RLS can extract the student_id from the path itself.
-- =====================================================================

-- 1. Create the bucket — private, 2MB hard limit, images only
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('passports', 'passports', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- 2. RLS policies on storage.objects, scoped to this bucket

-- Admin+ full access
create policy "passports_admin_all" on storage.objects
  for all using (
    bucket_id = 'passports' and is_admin_or_above()
  );

-- Class teacher: select + insert + update for their own students'
-- photos (student_id is the first path segment)
create policy "passports_class_teacher_select" on storage.objects
  for select using (
    bucket_id = 'passports'
    and my_role() = 'teacher'
    and is_class_teacher_of_student(((storage.foldername(name))[1])::uuid)
  );

create policy "passports_class_teacher_insert" on storage.objects
  for insert with check (
    bucket_id = 'passports'
    and my_role() = 'teacher'
    and is_class_teacher_of_student(((storage.foldername(name))[1])::uuid)
  );

create policy "passports_class_teacher_update" on storage.objects
  for update using (
    bucket_id = 'passports'
    and my_role() = 'teacher'
    and is_class_teacher_of_student(((storage.foldername(name))[1])::uuid)
  );

-- Parent: select only, for their own children's photos
create policy "passports_parent_select" on storage.objects
  for select using (
    bucket_id = 'passports'
    and my_role() = 'parent'
    and is_guardian_of(((storage.foldername(name))[1])::uuid)
  );