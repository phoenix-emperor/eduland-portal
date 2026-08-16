-- =====================================================================
-- Class teachers currently can only SELECT scores for subjects they
-- personally teach (scores_teacher_select, subject-scoped). A class
-- teacher compiling/reviewing a FULL report needs to see every
-- subject for their own class's students, not just their own. This
-- was never needed before Phase 6, since nothing previously required
-- viewing a full cross-subject report — only entering one's own
-- subject's scores.
-- =====================================================================

create policy "scores_class_teacher_select" on scores
  for select using (
    my_role() = 'teacher' and is_class_teacher_of_student(scores.student_id)
  );