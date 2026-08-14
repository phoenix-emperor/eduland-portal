"use server";

/**
 * @file app/dashboard/admin/actions.ts
 * @description Server Actions for Phase 3 Administrative Features in Eduland School Portal.
 * Handles CRUD management for classes, subjects, and student class promotion with enrollment history.
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";
import { UserRole } from "@/lib/types/database";
import { generateRandomPassword } from "@/lib/utils/generatePassword";
import { sendWelcomeEmail, sendPasswordResetEmail } from "@/lib/email/sendWelcomeEmail";

/**
 * Creates a new class scoped to the admin's school.
 *
 * @param name - Non-empty name for the new class.
 * @returns Object with `{ success: true }` or `{ error: string }`.
 */
export async function createClassAction(name: string) {
  const { profile } = await requireRole(["admin", "super_admin"]);

  const trimmedName = name ? name.trim() : "";
  if (!trimmedName) {
    return { error: "Class name cannot be empty." };
  }

  if (!profile?.school_id) {
    return { error: "School ID not found for your account." };
  }

  const supabase = await createClient();

  const { error } = await (supabase.from("classes") as any).insert({
    school_id: profile.school_id,
    name: trimmedName,
  });

  if (error) {
    // Format unique constraint violation (school_id, name)
    if (
      error.code === "23505" ||
      error.message.includes("unique") ||
      error.message.includes("duplicate")
    ) {
      return { error: `A class named "${trimmedName}" already exists.` };
    }
    return { error: error.message || "Failed to create class." };
  }

  revalidatePath("/dashboard/admin/classes-subjects");
  return { success: true };
}

/**
 * Renames an existing class.
 *
 * @param classId - Unique ID of the class to rename.
 * @param newName - Non-empty new class name.
 * @returns Object with `{ success: true }` or `{ error: string }`.
 */
export async function renameClassAction(classId: string, newName: string) {
  const { profile } = await requireRole(["admin", "super_admin"]);

  const trimmedName = newName ? newName.trim() : "";
  if (!trimmedName) {
    return { error: "Class name cannot be empty." };
  }

  if (!classId) {
    return { error: "Class ID is required." };
  }

  const supabase = await createClient();

  const { error } = await (supabase.from("classes") as any)
    .update({ name: trimmedName })
    .eq("id", classId)
    .eq("school_id", profile?.school_id || "");

  if (error) {
    if (
      error.code === "23505" ||
      error.message.includes("unique") ||
      error.message.includes("duplicate")
    ) {
      return { error: `A class named "${trimmedName}" already exists.` };
    }
    return { error: error.message || "Failed to rename class." };
  }

  revalidatePath("/dashboard/admin/classes-subjects");
  return { success: true };
}

/**
 * Deletes a class. Restricted strictly to Super Admin users.
 * Safely blocks deletion if active students or historical enrollments exist for the class.
 *
 * @param classId - ID of the class to delete.
 * @param className - Display name of the class for error messaging.
 * @returns Object with `{ success: true }` or `{ error: string }`.
 */
export async function deleteClassAction(classId: string, className: string) {
  const { profile } = await requireRole(["admin", "super_admin"]);

  // Route-level check: Only super_admin role can execute class deletion
  if (profile?.role !== "super_admin") {
    return {
      error: "Permission denied: Only Super Admins can delete classes.",
    };
  }

  if (!classId) {
    return { error: "Class ID is required." };
  }

  const supabase = await createClient();

  // Pre-check count of active students in this class
  const { count: studentCount, error: countError } = await (supabase.from("students") as any)
    .select("id", { count: "exact", head: true })
    .eq("class_id", classId);

  if (countError) {
    return {
      error: countError.message || "Failed to verify student enrollment.",
    };
  }

  if (studentCount && studentCount > 0) {
    return {
      error: `Can't delete '${className}' — it still has ${studentCount} student${
        studentCount > 1 ? "s" : ""
      } enrolled. Move them to another class first.`,
    };
  }

  // Pre-check count of historical enrollment records for this class
  const { count: enrollmentCount, error: enrollCountError } = await (
    supabase.from("enrollments") as any
  )
    .select("id", { count: "exact", head: true })
    .eq("class_id", classId);

  if (enrollCountError) {
    return {
      error: enrollCountError.message || "Failed to verify enrollment history.",
    };
  }

  if (enrollmentCount && enrollmentCount > 0) {
    return {
      error: `Can't delete '${className}' — it has ${enrollmentCount} historical enrollment record${
        enrollmentCount > 1 ? "s" : ""
      } tied to it from past students. Classes with academic history can't be deleted, to protect student records.`,
    };
  }

  // Attempt database deletion (ON DELETE RESTRICT safety)
  const { error } = await (supabase.from("classes") as any)
    .delete()
    .eq("id", classId)
    .eq("school_id", profile.school_id || "");

  if (error) {
    if (
      error.code === "23503" ||
      error.message.includes("foreign key") ||
      error.message.includes("constraint")
    ) {
      return {
        error: `Can't delete '${className}' — it has related academic records tied to it. Classes with academic history can't be deleted, to protect student records.`,
      };
    }
    return { error: error.message || "Failed to delete class." };
  }

  revalidatePath("/dashboard/admin/classes-subjects");
  return { success: true };
}

/**
 * Creates a new subject offering for the school.
 *
 * @param name - Non-empty subject name.
 * @returns Object with `{ success: true }` or `{ error: string }`.
 */
export async function createSubjectAction(name: string) {
  const { profile } = await requireRole(["admin", "super_admin"]);

  const trimmedName = name ? name.trim() : "";
  if (!trimmedName) {
    return { error: "Subject name cannot be empty." };
  }

  if (!profile?.school_id) {
    return { error: "School ID not found for your account." };
  }

  const supabase = await createClient();

  const { error } = await (supabase.from("subjects") as any).insert({
    school_id: profile.school_id,
    name: trimmedName,
  });

  if (error) {
    if (
      error.code === "23505" ||
      error.message.includes("unique") ||
      error.message.includes("duplicate")
    ) {
      return { error: `A subject named "${trimmedName}" already exists.` };
    }
    return { error: error.message || "Failed to create subject." };
  }

  revalidatePath("/dashboard/admin/classes-subjects");
  return { success: true };
}

/**
 * Renames an existing subject.
 *
 * @param subjectId - Unique ID of the subject.
 * @param newName - Non-empty new subject name.
 * @returns Object with `{ success: true }` or `{ error: string }`.
 */
export async function renameSubjectAction(subjectId: string, newName: string) {
  const { profile } = await requireRole(["admin", "super_admin"]);

  const trimmedName = newName ? newName.trim() : "";
  if (!trimmedName) {
    return { error: "Subject name cannot be empty." };
  }

  if (!subjectId) {
    return { error: "Subject ID is required." };
  }

  const supabase = await createClient();

  const { error } = await (supabase.from("subjects") as any)
    .update({ name: trimmedName })
    .eq("id", subjectId)
    .eq("school_id", profile?.school_id || "");

  if (error) {
    if (
      error.code === "23505" ||
      error.message.includes("unique") ||
      error.message.includes("duplicate")
    ) {
      return { error: `A subject named "${trimmedName}" already exists.` };
    }
    return { error: error.message || "Failed to rename subject." };
  }

  revalidatePath("/dashboard/admin/classes-subjects");
  return { success: true };
}

/**
 * Moves/promotes selected students from an old class to a new target class.
 * Records historical enrollment entries in `enrollments` for the old class & session.
 *
 * @param studentIds - Array of student IDs to move.
 * @param oldClassId - Source class ID.
 * @param newClassId - Target destination class ID.
 * @param session - Academic session string (e.g. "2025/2026") to attach to the historical enrollment record.
 * @returns Object with `{ success: true, count: number }` or `{ error: string }`.
 */
export async function moveStudentsAction(
  studentIds: string[],
  oldClassId: string,
  newClassId: string,
  session: string,
) {
  const { profile } = await requireRole(["admin", "super_admin"]);

  if (!studentIds || studentIds.length === 0) {
    return { error: "Please select at least one student to move." };
  }
  if (!oldClassId || !newClassId) {
    return { error: "Source and target classes are required." };
  }
  if (oldClassId === newClassId) {
    return { error: "Target class must be different from current class." };
  }
  if (!session) {
    return { error: "Please select a session." };
  }
  if (!profile?.school_id) {
    return { error: "School ID not found for your account." };
  }

  const supabase = await createClient();

  const { data, error } = await (supabase as any).rpc("promote_students", {
    p_student_ids: studentIds,
    p_old_class_id: oldClassId,
    p_new_class_id: newClassId,
    p_session: session,
    p_school_id: profile.school_id,
  });

  if (error) {
    return { error: error.message || "Failed to move students." };
  }

  revalidatePath("/dashboard/admin/students/promote");
  revalidatePath("/dashboard/admin/classes-subjects");
  return { success: true, count: data as number };
}

/**
 * Assigns a teacher to teach a subject for a specific class.
 * Explicitly includes `school_id` from the admin's profile to satisfy NOT NULL constraints.
 *
 * @param classId - Target class ID.
 * @param subjectId - Subject ID to assign.
 * @param teacherId - Teacher user profile ID (role must be 'teacher').
 * @returns Object with `{ success: true }` or `{ error: string }`.
 */
export async function assignSubjectTeacherAction(
  classId: string,
  subjectId: string,
  teacherId: string
) {
  const { profile } = await requireRole(["admin", "super_admin"]);

  if (!classId || !subjectId || !teacherId) {
    return { error: "Class, subject, and teacher selection are all required." };
  }

  if (!profile?.school_id) {
    return { error: "School ID not found for your account." };
  }

  const supabase = await createClient();

  const { error } = await (supabase.from("teacher_assignments") as any).insert({
    school_id: profile.school_id,
    class_id: classId,
    subject_id: subjectId,
    teacher_id: teacherId,
  });

  if (error) {
    if (
      error.code === "23505" ||
      error.message.includes("unique") ||
      error.message.includes("duplicate")
    ) {
      return {
        error: "This teacher is already assigned to this subject for this class.",
      };
    }
    return { error: error.message || "Failed to assign teacher to subject." };
  }

  revalidatePath("/dashboard/admin/teacher-assignments");
  return { success: true };
}

/**
 * Removes a subject teacher assignment.
 * Scoped by `school_id` and assignment `id`.
 *
 * @param assignmentId - Unique ID of the teacher_assignments row.
 * @returns Object with `{ success: true }` or `{ error: string }`.
 */
export async function unassignSubjectTeacherAction(assignmentId: string) {
  const { profile } = await requireRole(["admin", "super_admin"]);

  if (!assignmentId) {
    return { error: "Assignment ID is required." };
  }

  if (!profile?.school_id) {
    return { error: "School ID not found for your account." };
  }

  const supabase = await createClient();

  const { error } = await (supabase.from("teacher_assignments") as any)
    .delete()
    .eq("id", assignmentId)
    .eq("school_id", profile.school_id);

  if (error) {
    return { error: error.message || "Failed to unassign subject teacher." };
  }

  revalidatePath("/dashboard/admin/teacher-assignments");
  return { success: true };
}

/**
 * Designates or updates the single designated Class Teacher for a class.
 * Scoped by `school_id` and `class_id`.
 *
 * @param classId - Target class ID.
 * @param teacherId - Teacher profile ID to designate as class teacher (or null to unassign).
 * @returns Object with `{ success: true }` or `{ error: string }`.
 */
export async function setClassTeacherAction(
  classId: string,
  teacherId: string | null
) {
  const { profile } = await requireRole(["admin", "super_admin"]);

  if (!classId) {
    return { error: "Class ID is required." };
  }

  if (!profile?.school_id) {
    return { error: "School ID not found for your account." };
  }

  const supabase = await createClient();

  const { error } = await (supabase.from("classes") as any)
    .update({ class_teacher_id: teacherId })
    .eq("id", classId)
    .eq("school_id", profile.school_id);

  if (error) {
    return { error: error.message || "Failed to set class teacher." };
  }

  revalidatePath("/dashboard/admin/teacher-assignments");
  return { success: true };
}

/**
 * Input payload interface for creating or updating a student record.
 */
export interface StudentRecordInput {
  fullName: string;
  classId: string;
  admissionNumber?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
}

/**
 * Creates a new student record assigned to a class.
 * Scoped to the acting admin's school (`school_id`).
 * Enforces admission number requirement and sanity range checks on height/weight.
 *
 * @param input - Student data payload containing fullName, classId, admissionNumber, DOB, gender, height, weight.
 * @returns Object with `{ success: true, studentId: string }` or `{ error: string }`.
 */
export async function createStudentAction(input: StudentRecordInput) {
  const { profile } = await requireRole(["admin", "super_admin"]);

  const trimmedName = input.fullName?.trim();
  if (!trimmedName) {
    return { error: "Student full name is required." };
  }

  if (!input.classId) {
    return { error: "Class selection is required." };
  }

  const trimmedAdmission = input.admissionNumber?.trim();
  if (!trimmedAdmission) {
    return { error: "Admission number is required." };
  }

  if (trimmedAdmission.length > 50) {
    return { error: "Admission number must not exceed 50 characters." };
  }

  if (input.heightCm !== undefined && input.heightCm !== null) {
    const height = Number(input.heightCm);
    if (isNaN(height) || height < 30 || height > 250) {
      return { error: "Height must be between 30 cm and 250 cm." };
    }
  }

  if (input.weightKg !== undefined && input.weightKg !== null) {
    const weight = Number(input.weightKg);
    if (isNaN(weight) || weight < 1 || weight > 200) {
      return { error: "Weight must be between 1 kg and 200 kg." };
    }
  }

  if (!profile?.school_id) {
    return { error: "School ID not found for your account." };
  }

  const supabase = await createClient();

  const { data, error } = await (supabase.from("students") as any)
    .insert({
      school_id: profile.school_id,
      class_id: input.classId,
      full_name: trimmedName,
      admission_number: trimmedAdmission,
      date_of_birth: input.dateOfBirth || null,
      gender: input.gender || null,
      height_cm:
        input.heightCm !== undefined && input.heightCm !== null
          ? Number(input.heightCm)
          : null,
      weight_kg:
        input.weightKg !== undefined && input.weightKg !== null
          ? Number(input.weightKg)
          : null,
    })
    .select("id")
    .single();

  if (error) {
    if (
      error.code === "23505" ||
      error.message.includes("admission_number") ||
      error.message.includes("unique") ||
      error.message.includes("duplicate")
    ) {
      return {
        error: `A student with admission number '${trimmedAdmission}' already exists.`,
      };
    }
    return { error: error.message || "Failed to create student." };
  }

  revalidatePath("/dashboard/admin/students");
  revalidatePath("/dashboard/admin/classes-subjects");
  return { success: true, studentId: data.id as string };
}

/**
 * Updates a student's full name, class, and core profile attributes.
 * Scoped to the acting admin's school (`school_id`).
 *
 * @param studentId - ID of student to update.
 * @param input - Student data payload.
 * @returns Object with `{ success: true }` or `{ error: string }`.
 */
export async function updateStudentAction(
  studentId: string,
  input: StudentRecordInput
) {
  const { profile } = await requireRole(["admin", "super_admin"]);

  if (!studentId) {
    return { error: "Student ID is required." };
  }

  const trimmedName = input.fullName?.trim();
  if (!trimmedName) {
    return { error: "Student full name is required." };
  }

  if (!input.classId) {
    return { error: "Class selection is required." };
  }

  const trimmedAdmission = input.admissionNumber?.trim() || null;
  if (trimmedAdmission && trimmedAdmission.length > 50) {
    return { error: "Admission number must not exceed 50 characters." };
  }

  if (input.heightCm !== undefined && input.heightCm !== null) {
    const height = Number(input.heightCm);
    if (isNaN(height) || height < 30 || height > 250) {
      return { error: "Height must be between 30 cm and 250 cm." };
    }
  }

  if (input.weightKg !== undefined && input.weightKg !== null) {
    const weight = Number(input.weightKg);
    if (isNaN(weight) || weight < 1 || weight > 200) {
      return { error: "Weight must be between 1 kg and 200 kg." };
    }
  }

  if (!profile?.school_id) {
    return { error: "School ID not found for your account." };
  }

  const supabase = await createClient();

  const { error } = await (supabase.from("students") as any)
    .update({
      full_name: trimmedName,
      class_id: input.classId,
      admission_number: trimmedAdmission,
      date_of_birth: input.dateOfBirth || null,
      gender: input.gender || null,
      height_cm:
        input.heightCm !== undefined && input.heightCm !== null
          ? Number(input.heightCm)
          : null,
      weight_kg:
        input.weightKg !== undefined && input.weightKg !== null
          ? Number(input.weightKg)
          : null,
    })
    .eq("id", studentId)
    .eq("school_id", profile.school_id);

  if (error) {
    if (
      error.code === "23505" ||
      error.message.includes("admission_number") ||
      error.message.includes("unique") ||
      error.message.includes("duplicate")
    ) {
      return {
        error: `A student with admission number '${trimmedAdmission}' already exists.`,
      };
    }
    return { error: error.message || "Failed to update student details." };
  }

  revalidatePath("/dashboard/admin/students");
  revalidatePath("/dashboard/admin/classes-subjects");
  return { success: true };
}

/**
 * Updates a student's passport photo object path in `students.passport_url`.
 * Scoped to the acting admin's school (`school_id`).
 *
 * @param studentId - ID of target student.
 * @param passportPath - Object storage path (e.g. `${studentId}/passport.jpg`).
 * @returns Object with `{ success: true }` or `{ error: string }`.
 */
export async function updateStudentPassportAction(
  studentId: string,
  passportPath: string
) {
  const { profile } = await requireRole(["admin", "super_admin"]);

  if (!studentId || !passportPath) {
    return { error: "Student ID and passport photo path are required." };
  }

  if (!profile?.school_id) {
    return { error: "School ID not found for your account." };
  }

  const supabase = await createClient();

  const { error } = await (supabase.from("students") as any)
    .update({ passport_url: passportPath })
    .eq("id", studentId)
    .eq("school_id", profile.school_id);

  if (error) {
    return { error: error.message || "Failed to save student passport URL." };
  }

  revalidatePath("/dashboard/admin/students");
  revalidatePath("/dashboard/admin/students/promote");
  return { success: true };
}

/**
 * Creates a new academic term record (session, term name, optional next_term_begins).
 * Scoped to the acting admin's school (`school_id`).
 * Surfaces unique constraint (school_id, session, name) violation as a friendly message.
 *
 * @param session - Academic session (e.g. "2025/2026").
 * @param name - Term name (e.g. "First Term", "Second Term", "Third Term").
 * @param nextTermBegins - Optional date string ("YYYY-MM-DD") when next term starts.
 * @returns Object with `{ success: true, termId: string }` or `{ error: string }`.
 */
export async function createTermAction(
  session: string,
  name: string,
  nextTermBegins?: string | null
) {
  const { profile } = await requireRole(["admin", "super_admin"]);

  const trimmedSession = session?.trim();
  const trimmedName = name?.trim();

  if (!trimmedSession) {
    return { error: "Academic session is required (e.g. '2025/2026')." };
  }

  if (!trimmedName) {
    return { error: "Term name is required." };
  }

  if (!profile?.school_id) {
    return { error: "School ID not found for your account." };
  }

  const supabase = await createClient();

  const { data, error } = await (supabase.from("terms") as any)
    .insert({
      school_id: profile.school_id,
      session: trimmedSession,
      name: trimmedName,
      next_term_begins: nextTermBegins || null,
    })
    .select("id")
    .single();

  if (error) {
    if (
      error.code === "23505" ||
      error.message.includes("terms_school_id_session_name_key") ||
      error.message.includes("unique") ||
      error.message.includes("duplicate")
    ) {
      return {
        error: `A term named '${trimmedName}' already exists for session ${trimmedSession}.`,
      };
    }
    return { error: error.message || "Failed to create academic term." };
  }

  revalidatePath("/dashboard/admin/terms");
  return { success: true, termId: data.id as string };
}

/**
 * Updates an existing academic term record (session, term name, next_term_begins).
 * Scoped to the acting admin's school (`school_id`).
 * Surfaces duplicate constraint violation as a friendly message.
 *
 * @param termId - ID of term to update.
 * @param session - Academic session (e.g. "2025/2026").
 * @param name - Term name (e.g. "First Term").
 * @param nextTermBegins - Optional date string when next term starts.
 * @returns Object with `{ success: true }` or `{ error: string }`.
 */
export async function updateTermAction(
  termId: string,
  session: string,
  name: string,
  nextTermBegins?: string | null
) {
  const { profile } = await requireRole(["admin", "super_admin"]);

  if (!termId) {
    return { error: "Term ID is required." };
  }

  const trimmedSession = session?.trim();
  const trimmedName = name?.trim();

  if (!trimmedSession) {
    return { error: "Academic session is required." };
  }

  if (!trimmedName) {
    return { error: "Term name is required." };
  }

  if (!profile?.school_id) {
    return { error: "School ID not found for your account." };
  }

  const supabase = await createClient();

  const { error } = await (supabase.from("terms") as any)
    .update({
      session: trimmedSession,
      name: trimmedName,
      next_term_begins: nextTermBegins || null,
    })
    .eq("id", termId)
    .eq("school_id", profile.school_id);

  if (error) {
    if (
      error.code === "23505" ||
      error.message.includes("terms_school_id_session_name_key") ||
      error.message.includes("unique") ||
      error.message.includes("duplicate")
    ) {
      return {
        error: `A term named '${trimmedName}' already exists for session ${trimmedSession}.`,
      };
    }
    return { error: error.message || "Failed to update academic term." };
  }

  revalidatePath("/dashboard/admin/terms");
  return { success: true };
}

/**
 * Deletes an academic term record after verifying that no scores, attendance,
 * or report comments reference it.
 * Scoped to the acting admin's school (`school_id`).
 *
 * @param termId - ID of term to delete.
 * @returns Object with `{ success: true }` or `{ error: string }`.
 */
export async function deleteTermAction(termId: string) {
  const { profile } = await requireRole(["admin", "super_admin"]);

  if (!termId) {
    return { error: "Term ID is required." };
  }

  if (!profile?.school_id) {
    return { error: "School ID not found for your account." };
  }

  const supabase = await createClient();

  // Pre-check 1: Count tied score records
  const { count: scoresCount } = await (supabase.from("scores") as any)
    .select("*", { count: "exact", head: true })
    .eq("term_id", termId)
    .eq("school_id", profile.school_id);

  // Pre-check 2: Count tied attendance records
  const { count: attendanceCount } = await (supabase.from("attendance") as any)
    .select("*", { count: "exact", head: true })
    .eq("term_id", termId)
    .eq("school_id", profile.school_id);

  // Pre-check 3: Count tied report_comments records
  const { count: commentsCount } = await (supabase.from("report_comments") as any)
    .select("*", { count: "exact", head: true })
    .eq("term_id", termId)
    .eq("school_id", profile.school_id);

  const totalRecords =
    (scoresCount || 0) + (attendanceCount || 0) + (commentsCount || 0);

  if (totalRecords > 0) {
    return {
      error: `Can't delete this term — it has ${totalRecords} score/attendance/comment record(s) tied to it. Terms with academic records can't be deleted, to protect student data.`,
    };
  }

  // Safe to delete term
  const { error: deleteErr } = await (supabase.from("terms") as any)
    .delete()
    .eq("id", termId)
    .eq("school_id", profile.school_id);

  if (deleteErr) {
    return { error: deleteErr.message || "Failed to delete academic term." };
  }

  revalidatePath("/dashboard/admin/terms");
  return { success: true };
}

/**
 * Creates a new user account with a crypto-secure generated password and sends a custom welcome email via Resend.
 * Sets must_change_password = true and initializes profile role, full_name, phone, and school_id.
 * Server-enforces privilege escalation protection: only super_admin can create a super_admin account.
 *
 * @param email - Target email address for the new user.
 * @param fullName - Optional full name of new user.
 * @param role - Target assigned role (parent, teacher, admin, super_admin).
 * @param phone - Optional phone number string.
 * @returns Object with `{ success: true, userId: string, generatedPassword: string, message?: string }` or `{ error: string }`.
 */
export async function inviteUserAction(
  email: string,
  fullName?: string,
  role?: UserRole,
  phone?: string | null
) {
  const { profile: actingUser } = await requireRole(["admin", "super_admin"]);

  const trimmedEmail = email?.trim();
  const trimmedName = fullName?.trim() || "";
  const trimmedPhone = phone?.trim() || null;
  const targetRole: UserRole = role || "parent";

  if (!trimmedEmail) {
    return { error: "Email address is required." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return { error: "Please enter a valid email address." };
  }

  // Privilege Escalation Protection: Only super_admin can create as super_admin
  if (targetRole === "super_admin" && actingUser?.role !== "super_admin") {
    return {
      error: "Only super_admin users can assign or invite a super_admin.",
    };
  }

  if (!actingUser?.school_id) {
    return { error: "School ID not found for your account." };
  }

  const adminSupabase = createAdminClient();

  // Generate 12-character crypto-secure password
  const generatedPassword = generateRandomPassword();

  // Create user via Supabase Auth Admin API
  const { data: createData, error: createErr } =
    await adminSupabase.auth.admin.createUser({
      email: trimmedEmail,
      password: generatedPassword,
      email_confirm: true,
      user_metadata: { full_name: trimmedName || trimmedEmail },
    });

  if (createErr) {
    const errMsg = createErr.message?.toLowerCase() || "";
    if (
      errMsg.includes("already registered") ||
      errMsg.includes("already exists") ||
      errMsg.includes("duplicate")
    ) {
      return {
        error: `A user with email '${trimmedEmail}' already exists in the system.`,
      };
    }
    return { error: createErr.message || "Failed to create user account." };
  }

  if (!createData?.user?.id) {
    return { error: "Failed to obtain created user ID." };
  }

  const createdUserId = createData.user.id;

  // Update profiles record created by handle_new_auth_user trigger with assigned role, phone, school_id, and must_change_password = true
  const { error: profileUpdateErr } = await (adminSupabase.from("profiles") as any)
    .update({
      school_id: actingUser.school_id,
      full_name: trimmedName || trimmedEmail,
      role: targetRole,
      phone: trimmedPhone,
      must_change_password: true,
    })
    .eq("id", createdUserId);

  if (profileUpdateErr) {
    console.error("Profile sync error on account creation:", profileUpdateErr);
  }

  // Dispatch custom welcome email via Resend
  const emailResult = await sendWelcomeEmail({
    toEmail: trimmedEmail,
    fullName: trimmedName || trimmedEmail,
    password: generatedPassword,
    role: targetRole,
  });

  revalidatePath("/dashboard/admin/users");

  if (!emailResult.success) {
    console.warn(
      `Welcome email dispatch failed for ${trimmedEmail}:`,
      emailResult.error
    );
    return {
      success: true,
      userId: createdUserId,
      generatedPassword,
      message: `Account created, but the welcome email failed to send. Password: ${generatedPassword} — share this manually.`,
    };
  }

  return {
    success: true,
    userId: createdUserId,
    generatedPassword,
    message: `Account created successfully! Welcome email sent to ${trimmedEmail} with temporary password: ${generatedPassword}`,
  };
}

/**
 * Updates an existing user's role and/or phone number in the profiles table.
 * Server-enforces privilege escalation protection via explicit OR check BEFORE any DB mutation:
 * Rejects if targetUser.role === 'super_admin' OR newRole === 'super_admin' when acting user is not super_admin.
 *
 * @param targetUserId - ID of profile to update.
 * @param newRole - Target new role (parent, teacher, admin, super_admin).
 * @param phone - Optional phone number string.
 * @returns Object with `{ success: true }` or `{ error: string }`.
 */
export async function updateUserProfileAction(
  targetUserId: string,
  newRole: UserRole,
  phone?: string | null
) {
  const { profile: actingUser } = await requireRole(["admin", "super_admin"]);

  if (!targetUserId) {
    return { error: "Target user ID is required." };
  }

  if (!newRole) {
    return { error: "Target role is required." };
  }

  if (!actingUser?.school_id) {
    return { error: "School ID not found for your account." };
  }

  const adminSupabase = createAdminClient();

  // Fetch target profile to inspect existing role BEFORE performing any mutations
  const { data: targetProfile, error: targetErr } = await (
    adminSupabase.from("profiles") as any
  )
    .select("*")
    .eq("id", targetUserId)
    .eq("school_id", actingUser.school_id)
    .single();

  if (targetErr || !targetProfile) {
    return { error: "User profile not found in your school." };
  }

  // CRITICAL PRIVILEGE ESCALATION GUARD (Explicit OR condition):
  // Plain admin CANNOT touch an existing super_admin OR promote anyone to super_admin.
  // Rejects the entire call BEFORE any database mutation occurs (zero side-effects).
  if (
    (targetProfile.role === "super_admin" || newRole === "super_admin") &&
    actingUser.role !== "super_admin"
  ) {
    return {
      error: "Only super_admin users can assign or modify super_admin profiles.",
    };
  }

  const trimmedPhone = phone !== undefined ? (phone?.trim() || null) : targetProfile.phone;

  // Update target user's profile role and phone atomically
  const { error: updateErr } = await (adminSupabase.from("profiles") as any)
    .update({
      role: newRole,
      phone: trimmedPhone,
    })
    .eq("id", targetUserId)
    .eq("school_id", actingUser.school_id);

  if (updateErr) {
    return { error: updateErr.message || "Failed to update user profile." };
  }

  revalidatePath("/dashboard/admin/users");
  return { success: true };
}

/**
 * Backward compatibility alias for updateUserProfileAction.
 */
export const updateUserRoleAction = updateUserProfileAction;

/**
 * Deletes a user account from Supabase Auth.
 * Cascades to profiles. Foreign key references (scores, comments) set to NULL on delete.
 * Server-enforces guards: Rejects self-deletion and plain admin deleting a super_admin.
 *
 * @param targetUserId - ID of user account to delete.
 * @returns Object with `{ success: true }` or `{ error: string }`.
 */
export async function deleteUserAction(targetUserId: string) {
  const { user: actingUserAuth, profile: actingUser } = await requireRole([
    "admin",
    "super_admin",
  ]);

  if (!targetUserId) {
    return { error: "Target user ID is required." };
  }

  // Guard: Reject self-deletion
  if (targetUserId === actingUserAuth.id) {
    return { error: "You cannot delete your own account." };
  }

  if (!actingUser?.school_id) {
    return { error: "School ID not found for your account." };
  }

  const adminSupabase = createAdminClient();

  // Fetch target profile to inspect role
  const { data: targetProfile, error: targetErr } = await (
    adminSupabase.from("profiles") as any
  )
    .select("*")
    .eq("id", targetUserId)
    .eq("school_id", actingUser.school_id)
    .single();

  if (targetErr || !targetProfile) {
    return { error: "User profile not found in your school." };
  }

  // Guard: Reject plain admin deleting a super_admin
  if (targetProfile.role === "super_admin" && actingUser.role !== "super_admin") {
    return {
      error: "Only super_admin users can delete a super_admin profile.",
    };
  }

  // Delete user from Supabase Auth
  const { error: deleteErr } = await adminSupabase.auth.admin.deleteUser(
    targetUserId
  );

  if (deleteErr) {
    return { error: deleteErr.message || "Failed to delete user account." };
  }

  revalidatePath("/dashboard/admin/users");
  return { success: true };
}

/**
 * Disables or re-enables a user account using Supabase Auth ban_duration and profiles.is_disabled.
 * Server-enforces guards: Rejects self-disabling and plain admin disabling/enabling a super_admin.
 *
 * @param targetUserId - ID of user account to toggle.
 * @param disable - True to disable (ban), false to re-enable.
 * @returns Object with `{ success: true }` or `{ error: string }`.
 */
export async function toggleUserDisabledAction(
  targetUserId: string,
  disable: boolean
) {
  const { user: actingUserAuth, profile: actingUser } = await requireRole([
    "admin",
    "super_admin",
  ]);

  if (!targetUserId) {
    return { error: "Target user ID is required." };
  }

  // Guard: Reject disabling your own account
  if (disable && targetUserId === actingUserAuth.id) {
    return { error: "You cannot disable your own account." };
  }

  if (!actingUser?.school_id) {
    return { error: "School ID not found for your account." };
  }

  const adminSupabase = createAdminClient();

  // Fetch target profile to inspect role
  const { data: targetProfile, error: targetErr } = await (
    adminSupabase.from("profiles") as any
  )
    .select("*")
    .eq("id", targetUserId)
    .eq("school_id", actingUser.school_id)
    .single();

  if (targetErr || !targetProfile) {
    return { error: "User profile not found in your school." };
  }

  // Guard: Reject plain admin disabling/enabling a super_admin
  if (targetProfile.role === "super_admin" && actingUser.role !== "super_admin") {
    return {
      error: "Only super_admin users can disable or enable a super_admin profile.",
    };
  }

  // 1. Update Auth-level ban in Supabase Auth Admin API
  const { error: banErr } = await adminSupabase.auth.admin.updateUserById(
    targetUserId,
    {
      ban_duration: disable ? "876000h" : "none", // 100 years ban duration vs none
    }
  );

  if (banErr) {
    return {
      error: banErr.message || "Failed to update user Auth ban status.",
    };
  }

  // 2. Update profiles.is_disabled flag for UI filtering and immediate guard sign-out
  const { error: profileErr } = await (adminSupabase.from("profiles") as any)
    .update({ is_disabled: disable })
    .eq("id", targetUserId)
    .eq("school_id", actingUser.school_id);

  if (profileErr) {
    console.error("Failed to update profiles.is_disabled flag:", profileErr);
  }

  revalidatePath("/dashboard/admin/users");
  return { success: true };
}

/**
 * Resets a user's password using a crypto-secure generated password.
 * Updates Auth password via admin client, sets profiles.must_change_password = true,
 * and attempts to send a password reset email via Resend.
 * CRITICAL: ALWAYS returns the generated password in the response so the Admin UI displays it.
 *
 * @param targetUserId - ID of user account to reset.
 * @returns Object with `{ success: true, generatedPassword: string, message?: string }` or `{ error: string }`.
 */
export async function resetUserPasswordAction(targetUserId: string) {
  const { profile: actingUser } = await requireRole([
    "admin",
    "super_admin",
  ]);

  if (!targetUserId) {
    return { error: "Target user ID is required." };
  }

  if (!actingUser?.school_id) {
    return { error: "School ID not found for your account." };
  }

  const adminSupabase = createAdminClient();

  // Fetch target profile to inspect role and details
  const { data: targetProfile, error: targetErr } = await (
    adminSupabase.from("profiles") as any
  )
    .select("*")
    .eq("id", targetUserId)
    .eq("school_id", actingUser.school_id)
    .single();

  if (targetErr || !targetProfile) {
    return { error: "User profile not found in your school." };
  }

  // Guard: Reject plain admin resetting a super_admin's password
  if (targetProfile.role === "super_admin" && actingUser.role !== "super_admin") {
    return {
      error: "Only super_admin users can reset a super_admin password.",
    };
  }

  // Generate 12-character crypto-secure password
  const newPassword = generateRandomPassword();

  // 1. Update user password in Supabase Auth via Admin Client
  const { error: updateAuthErr } = await adminSupabase.auth.admin.updateUserById(
    targetUserId,
    { password: newPassword }
  );

  if (updateAuthErr) {
    return {
      error: updateAuthErr.message || "Failed to update user password in Auth.",
    };
  }

  // 2. Set must_change_password = true in profiles so next login forces password reset
  const { error: profileErr } = await (adminSupabase.from("profiles") as any)
    .update({ must_change_password: true })
    .eq("id", targetUserId)
    .eq("school_id", actingUser.school_id);

  if (profileErr) {
    console.error("Failed to set must_change_password flag on reset:", profileErr);
  }

  // Fetch target user email from Auth API to dispatch email
  let targetEmail = "";
  try {
    const { data: authUserData } = await adminSupabase.auth.admin.getUserById(
      targetUserId
    );
    targetEmail = authUserData?.user?.email || "";
  } catch (err) {
    console.error("Failed to fetch user email for reset notification:", err);
  }

  // Attempt to dispatch password reset email via Resend if email is known
  let emailSent = false;
  if (targetEmail) {
    const emailResult = await sendPasswordResetEmail({
      toEmail: targetEmail,
      fullName: targetProfile.full_name || targetEmail,
      password: newPassword,
    });
    emailSent = emailResult.success;
    if (!emailResult.success) {
      console.warn(
        `Password reset email dispatch failed for ${targetEmail}:`,
        emailResult.error
      );
    }
  }

  revalidatePath("/dashboard/admin/users");

  // ALWAYS return generatedPassword so UI displays it cleanly to admin
  return {
    success: true,
    generatedPassword: newPassword,
    message: emailSent
      ? `Password reset successfully! Email notification sent to ${targetEmail}.`
      : `Password reset successfully! Temporary password: ${newPassword}`,
  };
}


