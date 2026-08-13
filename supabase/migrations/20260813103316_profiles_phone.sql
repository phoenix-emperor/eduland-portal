-- =====================================================================
-- Add optional phone number to profiles. Applies to all roles
-- (parent, teacher, admin, super_admin) — nullable, no format
-- enforcement at the DB level (validate format in the UI if desired).
-- =====================================================================

alter table profiles add column phone text;