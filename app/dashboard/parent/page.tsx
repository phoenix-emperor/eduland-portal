/**
 * @file app/dashboard/parent/page.tsx
 * @description Server Component for Parent "Current Report" View.
 * Fetches the guardian's linked children, most recent term, scores, attendance,
 * general comments, grading keys, and signed passport URLs.
 */

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guard';
import ParentReportClient, {
  StudentReportData,
  TermData,
  GradingKeyItem,
} from '@/components/dashboard/parent/ParentReportClient';

export default async function ParentDashboardPage() {
  // Authenticate parent user
  const { user, profile } = await requireRole(['parent']);

  if (!profile?.school_id) {
    return (
      <div className="p-8 text-center text-red-800 bg-red-50 rounded-2xl border border-red-200">
        School ID not found for your guardian account. Please contact system administrator.
      </div>
    );
  }

  const supabase = await createClient();

  // 1. Fetch children linked to this guardian
  const { data: guardianLinks, error: linksErr } = await supabase
    .from('guardians_students')
    .select(`
      student_id,
      students:student_id (
        id,
        full_name,
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
      )
    `)
    .eq('guardian_id', user.id);

  if (linksErr) {
    console.error('Error fetching guardian student links:', linksErr);
  }

  if (!guardianLinks || guardianLinks.length === 0) {
    return (
      <ParentReportClient
        students={[]}
        currentTerm={null}
        gradingKeys={[]}
      />
    );
  }

  // 2. Fetch the most recent term
  const { data: terms, error: termsErr } = await supabase
    .from('terms')
    .select('*')
    .eq('school_id', profile.school_id)
    .order('created_at', { ascending: false })
    .limit(1);

  if (termsErr) {
    console.error('Error fetching current term:', termsErr);
  }

  const currentTerm: TermData | null =
    terms && terms.length > 0
      ? {
          id: terms[0].id,
          name: terms[0].name,
          session: terms[0].session,
          nextTermBegins: terms[0].next_term_begins,
        }
      : null;

  // 3. Fetch grading keys for the school
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

  // 4. Assemble report data for each linked child
  const studentReports: StudentReportData[] = await Promise.all(
    guardianLinks.map(async (link: any) => {
      const student = link.students;
      if (!student) return null;

      const classData = student.classes;
      const classTeacherName = classData?.profiles?.full_name || null;

      // Generate signed URL for passport photo if exists
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

      if (!currentTerm) {
        return {
          studentId: student.id,
          fullName: student.full_name,
          className: classData?.name || 'Unassigned',
          classTeacherName,
          signedPassportUrl,
          attendance: null,
          comment: null,
          scores: [],
        };
      }

      // Fetch scores for this student + current term
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
        .eq('term_id', currentTerm.id);

      // Fetch subject teachers for these scores
      const scores = await Promise.all(
        (scoresData || []).map(async (sc: any) => {
          const sub = sc.subjects;
          let teacherName: string | null = null;

          if (student.class_id && sc.subject_id) {
            const { data: assign } = await supabase
              .from('teacher_assignments')
              .select('teacher_id, profiles:teacher_id(full_name)')
              .eq('class_id', student.class_id)
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

      // Fetch attendance
      const { data: att } = await supabase
        .from('attendance')
        .select('days_opened, days_present')
        .eq('student_id', student.id)
        .eq('term_id', currentTerm.id)
        .maybeSingle();

      // Fetch general comment
      const { data: comm } = await supabase
        .from('report_comments')
        .select('general_comment, written_by, profiles:written_by(full_name)')
        .eq('student_id', student.id)
        .eq('term_id', currentTerm.id)
        .maybeSingle();

      const commentTeacherName = (comm?.profiles as any)?.full_name || null;

      return {
        studentId: student.id,
        fullName: student.full_name,
        className: classData?.name || 'Unassigned',
        classTeacherName,
        signedPassportUrl,
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
  ).then((results) => results.filter(Boolean) as StudentReportData[]);

  return (
    <ParentReportClient
      students={studentReports}
      currentTerm={currentTerm}
      gradingKeys={gradingKeys}
    />
  );
}
