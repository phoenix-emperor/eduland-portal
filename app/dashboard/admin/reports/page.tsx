/**
 * @file app/dashboard/admin/reports/page.tsx
 * @description Server Component for Admin "View Student Report" View.
 * Enforces requireRole(['admin', 'super_admin']) to restrict access to administrators only.
 * Fetches all students in the school, resolves historical class assignments from enrollments,
 * formats term reports (most recent first), generates signed passport photo URLs,
 * and passes dataset to AdminReportsClient.
 */

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guard';
import AdminReportsClient, {
  AdminStudentReportData,
} from '@/components/dashboard/admin/AdminReportsClient';
import { GradingKeyItem } from '@/components/dashboard/parent/ParentReportClient';
import { HistoricalTermReport } from '@/components/dashboard/parent/ParentHistoryClient';

export default async function AdminStudentReportsPage() {
  // Enforce role boundary: Only admin and super_admin accounts can access this page.
  // Attempts by teacher or parent accounts are rejected and redirected away by guard.
  const { user, profile } = await requireRole(['admin', 'super_admin']);

  if (!profile?.school_id) {
    return (
      <div className="p-8 text-center text-red-800 bg-red-50 rounded-2xl border border-red-200">
        School ID not found for your admin account. Please contact system administrator.
      </div>
    );
  }

  const supabase = await createClient();

  // 1. Fetch all students in the school ordered by full name
  const { data: studentsData, error: studentsErr } = await supabase
    .from('students')
    .select(`
      id,
      full_name,
      admission_number,
      passport_url,
      class_id,
      classes:class_id (
        id,
        name,
        class_teacher_id,
        profiles:class_teacher_id (
          full_name
        )
      )
    `)
    .eq('school_id', profile.school_id)
    .order('full_name', { ascending: true });

  if (studentsErr) {
    console.error('Error fetching students for admin report page:', studentsErr);
  }

  if (!studentsData || studentsData.length === 0) {
    return <AdminReportsClient students={[]} gradingKeys={[]} />;
  }

  // 2. Fetch all grading keys for the school
  const { data: gradingKeysData, error: keysErr } = await supabase
    .from('grading_keys')
    .select('*')
    .eq('school_id', profile.school_id)
    .order('min_score', { ascending: false });

  if (keysErr) {
    console.error('Error fetching grading keys:', keysErr);
  }

  const gradingKeys: GradingKeyItem[] =
    gradingKeysData && Array.isArray(gradingKeysData)
      ? gradingKeysData.map((k: any) => ({
          id: k.id,
          label: k.label,
          grade_letter: k.grade_letter,
          min_score: k.min_score,
          max_score: k.max_score,
        }))
      : [];

  // 3. Fetch all terms for the school ordered MOST RECENT FIRST
  const { data: schoolTerms, error: termsErr } = await supabase
    .from('terms')
    .select('*')
    .eq('school_id', profile.school_id)
    .order('created_at', { ascending: false });

  if (termsErr) {
    console.error('Error fetching school terms:', termsErr);
  }

  // 4. Assemble historical report data for each student in the school
  const studentHistories: AdminStudentReportData[] = await Promise.all(
    studentsData.map(async (student: any) => {
      const currentClassData = student.classes;
      const currentClassName = currentClassData?.name || 'Unassigned';

      // Generate signed URL for passport photo if present
      let signedPassportUrl: string | null = null;
      if (student.passport_url) {
        try {
          const { data: signedData } = await supabase.storage
            .from('passports')
            .createSignedUrl(student.passport_url, 3600);
          signedPassportUrl = signedData?.signedUrl || null;
        } catch (err) {
          console.error(`Failed to sign passport URL for student ${student.id}:`, err);
        }
      }

      if (!schoolTerms || schoolTerms.length === 0) {
        return {
          studentId: student.id,
          fullName: student.full_name,
          admissionNumber: student.admission_number,
          currentClassName,
          signedPassportUrl,
          terms: [],
        };
      }

      // Fetch historical report data per term
      const historicalTerms: (HistoricalTermReport | null)[] = await Promise.all(
        schoolTerms.map(async (term: any) => {
          // Fetch scores for this student + term
          const { data: scoresData } = await supabase
            .from('scores')
            .select(`
              id,
              hw,
              cw,
              test,
              total,
              subject_id,
              subjects:subject_id (
                id,
                name
              )
            `)
            .eq('student_id', student.id)
            .eq('term_id', term.id);

          // Fetch attendance
          const { data: att } = await supabase
            .from('attendance')
            .select('days_opened, days_present')
            .eq('student_id', student.id)
            .eq('term_id', term.id)
            .maybeSingle();

          // Fetch general comment
          const { data: comm } = await supabase
            .from('report_comments')
            .select('general_comment, written_by, profiles:written_by(full_name)')
            .eq('student_id', student.id)
            .eq('term_id', term.id)
            .maybeSingle();

          const hasData =
            (scoresData && scoresData.length > 0) ||
            Boolean(comm?.general_comment);

          // Skip terms with ZERO scores and ZERO comments for this student
          if (!hasData) return null;

          // Lookup historical class from enrollments table for (student_id, session)
          const { data: enrollment } = await supabase
            .from('enrollments')
            .select('class_id, classes:class_id(name, class_teacher_id, profiles:class_teacher_id(full_name))')
            .eq('student_id', student.id)
            .eq('session', term.session)
            .maybeSingle();

          const historicalClassId = (enrollment as any)?.class_id || student.class_id;

          // FALLBACK: If no enrollments row exists for session, fall back to current class_id
          const termClassName =
            (enrollment as any)?.classes?.name || currentClassName;

          const termClassTeacherName =
            (enrollment as any)?.classes?.profiles?.full_name || currentClassData?.profiles?.full_name || null;

          // Fetch subject teachers for scores in historical class
          const scores = await Promise.all(
            (scoresData || []).map(async (sc: any) => {
              const sub = sc.subjects;
              let teacherName: string | null = null;

              if (historicalClassId && sc.subject_id) {
                const { data: assign } = await supabase
                  .from('teacher_assignments')
                  .select('teacher_id, profiles:teacher_id(full_name)')
                  .eq('class_id', historicalClassId)
                  .eq('subject_id', sc.subject_id)
                  .maybeSingle();

                if (assign && assign.profiles) {
                  teacherName = (assign.profiles as any).full_name || null;
                }
              }

              return {
                id: sc.id,
                subject_id: sc.subject_id,
                subject_name: sub?.name || 'Unknown Subject',
                hw: Number(sc.hw || 0),
                cw: Number(sc.cw || 0),
                test: Number(sc.test || 0),
                total: Number(sc.total || 0),
                teacher_name: teacherName,
              };
            })
          );

          const commentTeacherName = (comm?.profiles as any)?.full_name || null;

          return {
            termId: term.id,
            termName: term.name,
            session: term.session,
            nextTermBegins: term.next_term_begins,
            createdAt: term.created_at,
            className: termClassName,
            classTeacherName: termClassTeacherName,
            attendance: att
              ? { daysOpened: att.days_opened, daysPresent: att.days_present }
              : null,
            comment: comm
              ? {
                  generalComment: comm.general_comment,
                  teacherName: commentTeacherName,
                }
              : null,
            scores,
          };
        })
      );

      // Filter out null terms (terms with zero data)
      const validTerms = historicalTerms.filter(Boolean) as HistoricalTermReport[];

      return {
        studentId: student.id,
        fullName: student.full_name,
        admissionNumber: student.admission_number,
        currentClassName,
        signedPassportUrl,
        terms: validTerms,
      };
    })
  );

  return (
    <AdminReportsClient
      students={studentHistories}
      gradingKeys={gradingKeys}
    />
  );
}
