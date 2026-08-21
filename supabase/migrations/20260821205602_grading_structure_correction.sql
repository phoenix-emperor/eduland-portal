-- =====================================================================
-- Correct grading structure to match the real Eduland report card:
-- C.A. (40) + Exam (60) = Total (100) — a single combined C.A. score,
-- not split into H/W + C/W. Also updates grading_keys to a 100-point
-- scale (previously 60-point), and adds head_of_school_name.
--
-- NOTE: existing hw/cw/test score data is NOT convertible to the new
-- structure (different scales, different meaning) — this will clear
-- existing scores. Given this only affects the demo dataset (no real
-- school is using this yet), that's an acceptable, expected tradeoff
-- — the demo scores need regenerating after this runs regardless.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Restructure scores: drop the generated total first (columns it
--    depends on can't be dropped while it exists), then hw/cw/test,
--    then add the new structure.
-- ---------------------------------------------------------------------
alter table scores drop column total;
alter table scores drop column hw;
alter table scores drop column cw;
alter table scores drop column test;

alter table scores add column ca numeric(5,2) not null default 0;
alter table scores add column exam numeric(5,2) not null default 0;
alter table scores add column total numeric(5,2) generated always as (ca + exam) stored;

-- ---------------------------------------------------------------------
-- 2. Update grading_keys to a 100-point scale, proportionally matching
--    the same 8-band structure already in use (A/B/C/D/E/F/Weak/Very
--    Weak), just scaled from 60 to 100.
--
--    NOTE: the real template's printed rating scale has an apparent
--    inconsistency at the bottom (shows both "30-39" and "Below 40"
--    for the lowest two bands, which overlap). Using a clean
--    proportional split instead — Weak 20-39, Very Weak 0-19 — since
--    that continues the same 10-point-per-band pattern as A-F above
--    it. Flag if the school's actual intended cutoffs differ.
-- ---------------------------------------------------------------------
delete from grading_keys where school_id = (select id from schools where name = 'Eduland Schools');

insert into grading_keys (school_id, label, grade_letter, min_score, max_score)
select id, label, grade_letter, min_score, max_score
from schools, (values
  ('Excellent',          'A', 90, 100),
  ('Very Good',          'B', 80, 89),
  ('Good',               'C', 70, 79),
  ('Fairly Good',        'D', 60, 69),
  ('Average',            'E', 50, 59),
  ('Needs Improvement',  'F', 40, 49),
  ('Weak',               'Weak', 20, 39),
  ('Very Weak',          'Very Weak', 0, 19)
) as gk(label, grade_letter, min_score, max_score)
where schools.name = 'Eduland Schools';

-- ---------------------------------------------------------------------
-- 3. Head of School — appears on the real report card as a second
--    signatory alongside the class teacher. School-level constant.
-- ---------------------------------------------------------------------
alter table schools add column head_of_school_name text;