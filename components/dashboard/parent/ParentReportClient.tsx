'use client';

/**
 * @file components/dashboard/parent/ParentReportClient.tsx
 * @description Client Component for Parent "Current Report" View.
 * Displays student switcher tabs, report history link, and current report sheet card.
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  User,
  History,
} from 'lucide-react';
import ReportSheetCard from '@/components/dashboard/parent/ReportSheetCard';

export interface GradingKeyItem {
  id: string;
  label: string;
  grade_letter: string;
  min_score: number;
  max_score: number;
}

export interface ScoreItem {
  id: string;
  subject_id: string;
  subject_name: string;
  hw: number;
  cw: number;
  test: number;
  total: number;
  teacher_name?: string | null;
}

export interface StudentReportData {
  studentId: string;
  fullName: string;
  className: string;
  classTeacherName?: string | null;
  signedPassportUrl?: string | null;
  attendance?: {
    daysOpened: number;
    daysPresent: number;
  } | null;
  comment?: {
    generalComment?: string | null;
    teacherName?: string | null;
  } | null;
  scores: ScoreItem[];
}

export interface TermData {
  id: string;
  name: string;
  session: string;
  nextTermBegins?: string | null;
}

interface ParentReportClientProps {
  students: StudentReportData[];
  currentTerm: TermData | null;
  gradingKeys: GradingKeyItem[];
}

export default function ParentReportClient({
  students,
  currentTerm,
  gradingKeys,
}: ParentReportClientProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.studentId || ''
  );

  // Edge state 1: Parent with 0 linked children
  if (!students || students.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-10 border border-olive-200 shadow-sm text-center max-w-4xl mx-auto space-y-4">
        <div className="w-16 h-16 bg-olive-100 text-olive-800 rounded-2xl flex items-center justify-center mx-auto border border-olive-200">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-olive-950">
          No Linked Students Found
        </h2>
        <p className="text-olive-700 text-sm max-w-md mx-auto leading-relaxed font-medium">
          There are currently no students linked to your guardian profile. Please contact your school administrator to link your child's student record.
        </p>
      </div>
    );
  }

  const activeStudent =
    students.find((s) => s.studentId === selectedStudentId) || students[0];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header Bar: Multi-Child Selector & Report History Quick Link */}
      <div className="bg-white rounded-2xl p-4 border border-olive-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        {/* Child Selector Tabs */}
        {students.length > 1 ? (
          <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-olive-800 shrink-0 pr-1">
              <User className="w-4 h-4 text-schoolYellow-600" />
              <span>Student:</span>
            </div>
            {students.map((child) => (
              <button
                key={child.studentId}
                type="button"
                onClick={() => setSelectedStudentId(child.studentId)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center space-x-1.5 ${
                  child.studentId === activeStudent.studentId
                    ? 'bg-olive-800 text-white shadow-xs'
                    : 'bg-olive-50 text-olive-900 border border-olive-200 hover:bg-olive-100'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>{child.fullName}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-olive-950 font-extrabold text-sm">
            <GraduationCap className="w-5 h-5 text-schoolYellow-600" />
            <span>Child Report: <span className="text-olive-800">{activeStudent.fullName}</span></span>
          </div>
        )}

        {/* Link to Report History */}
        <Link
          href="/dashboard/parent/history"
          className="px-4 py-2 bg-olive-50 hover:bg-olive-100 text-olive-900 border border-olive-200 font-bold text-xs rounded-xl shadow-2xs flex items-center space-x-2 transition-colors cursor-pointer shrink-0"
        >
          <History className="w-4 h-4 text-schoolYellow-600" />
          <span>View Report History</span>
        </Link>
      </div>

      {/* Main Reusable Report Sheet Card */}
      <ReportSheetCard
        studentName={activeStudent.fullName}
        className={activeStudent.className}
        classTeacherName={activeStudent.classTeacherName}
        signedPassportUrl={activeStudent.signedPassportUrl}
        termName={currentTerm?.name}
        session={currentTerm?.session}
        nextTermBegins={currentTerm?.nextTermBegins}
        daysOpened={activeStudent.attendance?.daysOpened || 0}
        daysPresent={activeStudent.attendance?.daysPresent || 0}
        scores={activeStudent.scores || []}
        gradingKeys={gradingKeys}
        generalComment={activeStudent.comment?.generalComment}
        commentTeacherName={activeStudent.comment?.teacherName}
      />
    </div>
  );
}
