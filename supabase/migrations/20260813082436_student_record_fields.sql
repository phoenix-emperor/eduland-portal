-- =====================================================================
-- Add core student record fields: DOB, gender, admission number,
-- height, weight. All nullable — existing students have none of this
-- data yet, and NOT NULL would break their existing rows. The admin
-- UI can require these for newly-created students without the DB
-- itself enforcing it.
-- =====================================================================

alter table students add column date_of_birth date;
alter table students add column gender text;
alter table students add column admission_number text;
alter table students add column height_cm numeric(5,2);
alter table students add column weight_kg numeric(5,2);

-- Admission numbers should be unique within a school (not globally,
-- since this becomes multi-tenant eventually)
alter table students add constraint students_admission_number_key unique (school_id, admission_number);