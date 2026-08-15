/**
 * @file app/dashboard/parent/history/page.tsx
 * @description Server Component for Parent "Report History" View.
 * Fetches historical terms with recorded scores or comments for linked children,
 * resolves historical class names from enrollments (with fallback to current class),
 * and passes historical report data to ParentHistoryClient.
 */

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guard";
import ParentHistoryClient, {
  StudentHistoryData,
  HistoricalTermReport,
} from "@/components/dashboard/parent/ParentHistoryClient";
import { GradingKeyItem } from "@/components/dashboard/parent/ParentReportClient";

export default async function ParentReportHistoryPage() {
  // Authenticate parent user
  const { user, profile } = await requireRole(["parent"]);

  if (!profile?.school_id) {
    return (
      <div className="p-8 text-center text-red-800 bg-red-50 rounded-2xl border border-red-200">
        School ID not found for your guardian account. Please contact system
        administrator.
      </div>
    );
  }

  const supabase = await createClient();

  // 1. Fetch children linked to this guardian
  const { data: guardianLinks, error: linksErr } = await supabase
    .from("guardians_students")
    .select(
      `
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
    `,
    )
    .eq("guardian_id", user.id);

  if (linksErr) {
    console.error("Error fetching guardian student links:", linksErr);
  }

  if (!guardianLinks || guardianLinks.length === 0) {
    return <ParentHistoryClient students={[]} gradingKeys={[]} />;
  }

  // 2. Fetch all grading keys for the school
  const { data: gradingKeysData, error: keysErr } = await supabase
    .from("grading_keys")
    .select("*")
    .eq("school_id", profile.school_id)
    .order("min_score", { ascending: false });

  if (keysErr) {
    console.error("Error fetching grading keys:", keysErr);
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
    .from("terms")
    .select("*")
    .eq("school_id", profile.school_id)
    .order("created_at", { ascending: false });

  if (termsErr) {
    console.error("Error fetching school terms:", termsErr);
  }

  // 4. Assemble historical report data for each linked child
  const studentHistories: StudentHistoryData[] = await Promise.all(
    guardianLinks.map(async (link: any) => {
      const student = link.students;
      if (!student) return null;

      const currentClassData = student.classes;
      const currentClassName = currentClassData?.name || "Unassigned";

      // Generate signed URL for passport photo if present
      let signedPassportUrl: string | null = null;
      if (student.passport_url) {
        try {
          const { data: signedData } = await supabase.storage
            .from("passports")
            .createSignedUrl(student.passport_url, 3600);
          signedPassportUrl = signedData?.signedUrl || null;
        } catch (err) {
          console.error(
            `Failed to sign passport URL for student ${student.id}:`,
            err,
          );
        }
      }

      if (!schoolTerms || schoolTerms.length === 0) {
        return {
          studentId: student.id,
          fullName: student.full_name,
          currentClassName,
          signedPassportUrl,
          terms: [],
        };
      }

      // Fetch historical data per term
      const historicalTerms: (HistoricalTermReport | null)[] =
        await Promise.all(
          schoolTerms.map(async (term: any) => {
            // Fetch scores for this term
            const { data: scoresData } = await supabase
              .from("scores")
              .select(
                `
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
            `,
              )
              .eq("student_id", student.id)
              .eq("term_id", term.id);

            // Fetch attendance
            const { data: att } = await supabase
              .from("attendance")
              .select("days_opened, days_present")
              .eq("student_id", student.id)
              .eq("term_id", term.id)
              .maybeSingle();

            // Fetch general comment
            const { data: comm } = await supabase
              .from("report_comments")
              .select(
                "general_comment, written_by, profiles:written_by(full_name)",
              )
              .eq("student_id", student.id)
              .eq("term_id", term.id)
              .maybeSingle();

            const hasData =
              (scoresData && scoresData.length > 0) ||
              Boolean(comm?.general_comment);

            // Skip terms with ZERO scores and ZERO comments for this child
            if (!hasData) return null;

            // Lookup historical class from enrollments table for (student_id, session)
            const { data: enrollment } = await supabase
              .from("enrollments")
              .select("class_id, classes:class_id(name)")
              .eq("student_id", student.id)
              .eq("session", term.session)
              .maybeSingle();

            // FALLBACK: If no enrollments row exists for session, fall back to current class_id
            const termClassName =
              (enrollment as any)?.classes?.name || currentClassName;

            // Fetch subject teachers for scores
            const scores = await Promise.all(
              (scoresData || []).map(async (sc: any) => {
                const sub = sc.subjects;
                let teacherName: string | null = null;

                if (student.class_id && sc.subject_id) {
                  const { data: assign } = await supabase
                    .from("teacher_assignments")
                    .select("teacher_id, profiles:teacher_id(full_name)")
                    .eq("class_id", student.class_id)
                    .eq("subject_id", sc.subject_id)
                    .maybeSingle();

                  if (assign && assign.profiles) {
                    teacherName = (assign.profiles as any).full_name || null;
                  }
                }

                return {
                  id: sc.id,
                  subject_id: sc.subject_id,
                  subject_name: sub?.name || "Unknown Subject",
                  hw: Number(sc.hw || 0),
                  cw: Number(sc.cw || 0),
                  test: Number(sc.test || 0),
                  total: Number(sc.total || 0),
                  teacher_name: teacherName,
                };
              }),
            );

            const commentTeacherName =
              (comm?.profiles as any)?.full_name || null;

            return {
              termId: term.id,
              termName: term.name,
              session: term.session,
              nextTermBegins: term.next_term_begins,
              createdAt: term.created_at,
              className: termClassName,
              classTeacherName: currentClassData?.profiles?.full_name || null,
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
          }),
        );

      // Filter out null terms (terms with zero data)
      const validTerms = historicalTerms.filter(
        Boolean,
      ) as HistoricalTermReport[];

      return {
        studentId: student.id,
        fullName: student.full_name,
        currentClassName,
        signedPassportUrl,
        terms: validTerms,
      };
    }),
  ).then((results) => results.filter(Boolean) as StudentHistoryData[]);

  return (
    <ParentHistoryClient
      students={studentHistories}
      gradingKeys={gradingKeys}
    />
  );
}
