-- =====================================================================
-- Two changes needed before user deletion can work safely:
--
-- 1. scores.entered_by and report_comments.written_by currently have
--    no ON DELETE behavior, which defaults to blocking deletion of
--    any user who has ever entered a score or written a comment.
--    Change to ON DELETE SET NULL — historical data survives, only
--    the "who entered this" attribution is lost. Same pattern already
--    used for classes.class_teacher_id.
--
-- 2. Add must_change_password flag to profiles, for the forced
--    password-change-on-first-login flow.
-- =====================================================================

alter table scores drop constraint scores_entered_by_fkey;
alter table scores add constraint scores_entered_by_fkey
  foreign key (entered_by) references profiles(id) on delete set null;

alter table report_comments drop constraint report_comments_written_by_fkey;
alter table report_comments add constraint report_comments_written_by_fkey
  foreign key (written_by) references profiles(id) on delete set null;

alter table profiles add column must_change_password boolean not null default false;