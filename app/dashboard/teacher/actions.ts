'use server';

/**
 * @file app/dashboard/teacher/actions.ts
 * @description Server Actions for Teacher Gradebook operations.
 * Handles bulk score entry validation and upserting into the `scores` table.
 * Excludes generated `total` column to allow PostgreSQL computed calculation.
 * Attaches `entered_by` user attribution and enforces score range constraints (0-20).
 */

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guard';
import { revalidatePath } from 'next/cache';

export interface ScoreInputItem {
  studentId: string;
  hw: number;
  cw: number;
  test: number;
}

export interface BulkSaveScoresParams {
  classId: string;
  subjectId: string;
  termId: string;
  scores: ScoreInputItem[];
}

/**
 * Bulk saves or updates scores for a list of students in a specific class, subject, and term.
 * Performs database upsert using unique constraint on (student_id, subject_id, term_id).
 *
 * @param params - BulkSaveScoresParams containing classId, subjectId, termId, and scores array.
 * @returns Object with `{ success: true, count: number }` or `{ error: string }`.
 */
export async function bulkSaveScoresAction({
  classId,
  subjectId,
  termId,
  scores,
}: BulkSaveScoresParams): Promise<{ success?: boolean; count?: number; error?: string }> {
  const { user, profile } = await requireRole(['teacher', 'admin', 'super_admin']);

  if (!profile?.school_id) {
    return { error: 'School ID not found for your account.' };
  }

  if (!classId || !subjectId || !termId) {
    return { error: 'Class, Subject, and Term must be selected.' };
  }

  if (!scores || !Array.isArray(scores) || scores.length === 0) {
    return { error: 'No student scores provided to save.' };
  }

  const supabase = await createClient();

  // Teacher Assignment Verification:
  // If the user is a plain teacher, verify they are assigned to this (classId, subjectId)
  if (profile.role === 'teacher') {
    const { data: assignmentCheck } = await supabase
      .from('teacher_assignments')
      .select('id')
      .eq('teacher_id', user.id)
      .eq('class_id', classId)
      .eq('subject_id', subjectId)
      .eq('school_id', profile.school_id)
      .maybeSingle();

    if (!assignmentCheck) {
      return { error: 'You are not assigned to teach this subject for the selected class.' };
    }
  }

  // Server-side Score Range Validation (0 to 20 for H/W, C/W, Test)
  for (const item of scores) {
    if (
      typeof item.hw !== 'number' || item.hw < 0 || item.hw > 20 ||
      typeof item.cw !== 'number' || item.cw < 0 || item.cw > 20 ||
      typeof item.test !== 'number' || item.test < 0 || item.test > 20
    ) {
      return {
        error: `Invalid score value detected for a student. All score components (Homework, Classwork, Test) must be numbers between 0 and 20.`,
      };
    }
  }

  // Construct Upsert Payload (EXCLUDES `total` because `total` is a generated column in DB)
  const rowsToUpsert = scores.map((item) => ({
    school_id: profile.school_id,
    student_id: item.studentId,
    subject_id: subjectId,
    term_id: termId,
    hw: Math.round(item.hw),
    cw: Math.round(item.cw),
    test: Math.round(item.test),
    entered_by: user.id,
    updated_at: new Date().toISOString(),
  }));

  try {
    const { error: upsertErr } = await supabase
      .from('scores')
      .upsert(rowsToUpsert, {
        onConflict: 'student_id,subject_id,term_id',
      });

    if (upsertErr) {
      console.error('Gradebook bulk upsert error:', upsertErr);
      const errMsg = upsertErr.message?.toLowerCase() || '';

      if (errMsg.includes('row-level security') || errMsg.includes('policy')) {
        return { error: 'You do not have permission to save scores for this class/subject.' };
      }
      return { error: upsertErr.message || 'Failed to save gradebook scores to the database.' };
    }

    revalidatePath('/dashboard/teacher/gradebook');
    return { success: true, count: rowsToUpsert.length };
  } catch (err: any) {
    console.error('Unexpected error during gradebook save:', err);
    return { error: err?.message || 'An unexpected error occurred while saving scores.' };
  }
}

/**
 * Fetches enrolled students in a class alongside their existing scores for a specific subject and term.
 *
 * @param classId - Target class ID.
 * @param subjectId - Target subject ID.
 * @param termId - Target term ID.
 * @returns Object with students and scores data.
 */
export async function getGradebookStudentsAndScoresAction({
  classId,
  subjectId,
  termId,
}: {
  classId: string;
  subjectId: string;
  termId: string;
}) {
  const { profile } = await requireRole(['teacher', 'admin', 'super_admin']);

  if (!profile?.school_id || !classId || !subjectId || !termId) {
    return { students: [], scoresMap: {} };
  }

  const supabase = await createClient();

  // 1. Fetch all students in the class
  const { data: students, error: studentErr } = await supabase
    .from('students')
    .select('id, full_name, admission_number')
    .eq('class_id', classId)
    .eq('school_id', profile.school_id)
    .order('full_name', { ascending: true });

  if (studentErr || !students) {
    console.error('Failed to fetch class students for gradebook:', studentErr);
    return { students: [], scoresMap: {} };
  }

  // 2. Fetch existing scores for this subject and term
  const { data: existingScores, error: scoreErr } = await supabase
    .from('scores')
    .select('id, student_id, hw, cw, test, total')
    .eq('subject_id', subjectId)
    .eq('term_id', termId)
    .eq('school_id', profile.school_id);

  if (scoreErr) {
    console.error('Failed to fetch existing scores for gradebook:', scoreErr);
  }

  // Map scores by student_id
  const scoresMap: Record<
    string,
    { id?: string; hw: number; cw: number; test: number; total: number }
  > = {};

  if (existingScores) {
    existingScores.forEach((s) => {
      scoresMap[s.student_id] = {
        id: s.id,
        hw: s.hw,
        cw: s.cw,
        test: s.test,
        total: s.total ?? s.hw + s.cw + s.test,
      };
    });
  }

  return { students, scoresMap };
}

export interface AttendanceInputItem {
  studentId: string;
  daysPresent: number;
}

export interface BulkSaveAttendanceParams {
  classId: string;
  termId: string;
  daysOpened: number;
  attendanceRecords: AttendanceInputItem[];
}

/**
 * Bulk saves or updates attendance records for students in a designated class for a given term.
 * CLASS-TEACHER-ONLY: Validates that the acting teacher is designated as classes.class_teacher_id.
 * Performs database upsert using unique constraint on (student_id, term_id).
 *
 * @param params - BulkSaveAttendanceParams containing classId, termId, daysOpened, and attendanceRecords array.
 * @returns Object with `{ success: true, count: number }` or `{ error: string }`.
 */
export async function bulkSaveAttendanceAction({
  classId,
  termId,
  daysOpened,
  attendanceRecords,
}: BulkSaveAttendanceParams): Promise<{ success?: boolean; count?: number; error?: string }> {
  const { user, profile } = await requireRole(['teacher', 'admin', 'super_admin']);

  if (!profile?.school_id) {
    return { error: 'School ID not found for your account.' };
  }

  if (!classId || !termId) {
    return { error: 'Class and Term must be selected.' };
  }

  if (typeof daysOpened !== 'number' || daysOpened < 0) {
    return { error: 'Days School Opened must be a non-negative number.' };
  }

  if (!attendanceRecords || !Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
    return { error: 'No student attendance records provided.' };
  }

  const supabase = await createClient();

  // Class Teacher Verification:
  // If acting user is a plain teacher, verify they are designated as `class_teacher_id` for this class
  if (profile.role === 'teacher') {
    const { data: classCheck } = await supabase
      .from('classes')
      .select('id')
      .eq('id', classId)
      .eq('class_teacher_id', user.id)
      .eq('school_id', profile.school_id)
      .maybeSingle();

    if (!classCheck) {
      return { error: 'You are not designated as the class teacher for this class.' };
    }
  }

  // Server-side Range Validation: daysPresent must not exceed daysOpened
  for (const item of attendanceRecords) {
    if (typeof item.daysPresent !== 'number' || item.daysPresent < 0) {
      return { error: 'Days present must be a non-negative number for every student.' };
    }
    if (item.daysPresent > daysOpened) {
      return { error: `Days present (${item.daysPresent}) cannot exceed total days school opened (${daysOpened}).` };
    }
  }

  // Construct Upsert Payload (attendance table has NO `entered_by` column)
  const rowsToUpsert = attendanceRecords.map((item) => ({
    school_id: profile.school_id,
    student_id: item.studentId,
    term_id: termId,
    days_opened: Math.round(daysOpened),
    days_present: Math.round(item.daysPresent),
  }));

  try {
    const { error: upsertErr } = await supabase
      .from('attendance')
      .upsert(rowsToUpsert, {
        onConflict: 'student_id,term_id',
      });

    if (upsertErr) {
      console.error('Attendance bulk upsert error:', upsertErr);
      const errMsg = upsertErr.message?.toLowerCase() || '';

      if (errMsg.includes('row-level security') || errMsg.includes('policy')) {
        return { error: 'You do not have permission to save attendance for this class.' };
      }
      return { error: upsertErr.message || 'Failed to save attendance records to the database.' };
    }

    revalidatePath('/dashboard/teacher/attendance');
    return { success: true, count: rowsToUpsert.length };
  } catch (err: any) {
    console.error('Unexpected error during attendance save:', err);
    return { error: err?.message || 'An unexpected error occurred while saving attendance.' };
  }
}

/**
 * Fetches enrolled students in a class alongside their existing attendance records for a specific term.
 *
 * @param classId - Target class ID.
 * @param termId - Target term ID.
 * @returns Object with students, attendanceMap, and existingDaysOpened.
 */
export async function getAttendanceStudentsAndRecordsAction({
  classId,
  termId,
}: {
  classId: string;
  termId: string;
}) {
  const { profile } = await requireRole(['teacher', 'admin', 'super_admin']);

  if (!profile?.school_id || !classId || !termId) {
    return { students: [], attendanceMap: {}, existingDaysOpened: 0 };
  }

  const supabase = await createClient();

  // 1. Fetch all students in the class
  const { data: students, error: studentErr } = await supabase
    .from('students')
    .select('id, full_name, admission_number')
    .eq('class_id', classId)
    .eq('school_id', profile.school_id)
    .order('full_name', { ascending: true });

  if (studentErr || !students) {
    console.error('Failed to fetch class students for attendance:', studentErr);
    return { students: [], attendanceMap: {}, existingDaysOpened: 0 };
  }

  // 2. Fetch existing attendance records for this class & term
  const { data: existingAttendance, error: attErr } = await supabase
    .from('attendance')
    .select('id, student_id, days_opened, days_present')
    .eq('term_id', termId)
    .eq('school_id', profile.school_id);

  if (attErr) {
    console.error('Failed to fetch existing attendance records:', attErr);
  }

  // Map attendance by student_id
  const attendanceMap: Record<string, { id?: string; daysOpened: number; daysPresent: number }> = {};
  let existingDaysOpened = 0;

  if (existingAttendance && existingAttendance.length > 0) {
    // Collect student IDs for this class
    const classStudentIds = new Set(students.map((s) => s.id));

    existingAttendance.forEach((att) => {
      if (classStudentIds.has(att.student_id)) {
        attendanceMap[att.student_id] = {
          id: att.id,
          daysOpened: att.days_opened,
          daysPresent: att.days_present,
        };
        if (att.days_opened > 0) {
          existingDaysOpened = att.days_opened;
        }
      }
    });
  }

  return { students, attendanceMap, existingDaysOpened };
}
