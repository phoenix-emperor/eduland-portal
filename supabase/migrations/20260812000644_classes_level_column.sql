-- =====================================================================
-- Add a `level` column to classes — groups arms of the same grade
-- level (e.g. "Year 1 Blue" and "Year 1 Orange" would both have
-- level = "Year 1") for future cross-arm reporting/awards.
-- Backfilled from the existing `name`, since the school currently
-- has exactly one arm per class — level and name are identical today.
-- =====================================================================

alter table classes add column level text;

update classes set level = name where level is null;

-- Not set NOT NULL yet — deliberately left nullable so future class
-- creation isn't forced to think about "level" until arms actually
-- exist and the admin UI is updated to ask for it.