'use client';

/**
 * @file components/dashboard/parent/ParentHistoryClient.tsx
 * @description Client Component for Parent "Report History" View.
 * Renders child selector, term selector (most recent first), back navigation to Current Report,
 * and historical report card sheet using ReportSheetCard.
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  User,
  Calendar,
  ArrowLeft,
  Clock,
  BookOpen,
} from 'lucide-react';
import ReportSheetCard from '@/components/dashboard/parent/ReportSheetCard';
import {
  GradingKeyItem,
  ScoreItem,
} from '@/components/dashboard/parent/ParentReportClient';

export interface HistoricalTermReport {
  termId: string;
  termName: string;
  session: string;
  nextTermBegins?: string | null;
  createdAt: string;
  className: string;
  classTeacherName?: string | null;
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

export interface StudentHistoryData {
  studentId: string;
  fullName: string;
  currentClassName: string;
  signedPassportUrl?: string | null;
  terms: HistoricalTermReport[];
}

interface ParentHistoryClientProps {
  students: StudentHistoryData[];
  gradingKeys: GradingKeyItem[];
}

export default function ParentHistoryClient({
  students,
  gradingKeys,
}: ParentHistoryClientProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.studentId || ''
  );

  const activeStudent =
    students.find((s) => s.studentId === selectedStudentId) || students[0];

  // Default selected term to the first historical term (most recent)
  const [selectedTermId, setSelectedTermId] = useState<string>(
    activeStudent?.terms[0]?.termId || ''
  );

  // When active student changes, reset selectedTermId to that student's most recent term
  const handleStudentChange = (id: string) => {
    setSelectedStudentId(id);
    const newStudent = students.find((s) => s.studentId === id);
    if (newStudent && newStudent.terms.length > 0) {
      setSelectedTermId(newStudent.terms[0].termId);
    } else {
      setSelectedTermId('');
    }
  };

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

  const activeTerm =
    activeStudent?.terms.find((t) => t.termId === selectedTermId) ||
    activeStudent?.terms[0];

  const hasHistory = activeStudent && activeStudent.terms.length > 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header Navigation & Action Bar */}
      <div className="bg-white rounded-2xl p-5 border border-olive-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center space-x-2 text-olive-950 font-black text-xl">
            <BookOpen className="w-6 h-6 text-schoolYellow-600" />
            <span>Academic Report History</span>
          </div>
          <p className="text-xs text-olive-700 font-medium mt-0.5">
            View historical academic reports across previous terms for your child.
          </p>
        </div>

        {/* Back to Current Report Link */}
        <Link
          href="/dashboard/parent"
          className="px-4 py-2.5 bg-schoolYellow-500 hover:bg-schoolYellow-400 text-olive-950 font-bold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Current Report</span>
        </Link>
      </div>

      {/* Child & Term Selector Bar */}
      <div className="bg-white rounded-2xl p-4 border border-olive-200 shadow-sm space-y-3 print:hidden">
        {/* Child Selector Tabs (when 2+ children exist) */}
        {students.length > 1 && (
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-olive-100">
            <div className="flex items-center space-x-1 text-xs font-bold text-olive-800 shrink-0 pr-1">
              <User className="w-4 h-4 text-schoolYellow-600" />
              <span>Select Child:</span>
            </div>
            {students.map((child) => (
              <button
                key={child.studentId}
                type="button"
                onClick={() => handleStudentChange(child.studentId)}
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
        )}

        {/* Term List Selector (Sorted Most Recent First) */}
        {hasHistory && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-olive-800 shrink-0">
              <Calendar className="w-4 h-4 text-schoolYellow-600" />
              <span>Select Term (Most Recent First):</span>
            </div>

            <div className="flex items-center space-x-2 overflow-x-auto">
              {activeStudent.terms.map((termItem) => (
                <button
                  key={termItem.termId}
                  type="button"
                  onClick={() => setSelectedTermId(termItem.termId)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center space-x-1.5 ${
                    termItem.termId === activeTerm?.termId
                      ? 'bg-olive-800 text-white shadow-xs ring-2 ring-schoolYellow-400'
                      : 'bg-olive-50 text-olive-900 border border-olive-200 hover:bg-olive-100'
                  }`}
                >
                  <span>{termItem.termName} ({termItem.session})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Report Sheet Section / Empty State */}
      {!hasHistory || !activeTerm ? (
        <div className="bg-white rounded-2xl p-12 border border-olive-200 shadow-sm text-center space-y-3">
          <Clock className="w-12 h-12 text-olive-400 mx-auto" />
          <h3 className="text-lg font-extrabold text-olive-950">
            No Historical Reports Found
          </h3>
          <p className="text-olive-700 text-sm font-medium max-w-md mx-auto">
            No past term reports or scores have been recorded for <span className="font-bold text-olive-900">{activeStudent.fullName}</span> yet.
          </p>
        </div>
      ) : (
        <ReportSheetCard
          studentName={activeStudent.fullName}
          className={activeTerm.className}
          classTeacherName={activeTerm.classTeacherName}
          signedPassportUrl={activeStudent.signedPassportUrl}
          termName={activeTerm.termName}
          session={activeTerm.session}
          nextTermBegins={activeTerm.nextTermBegins}
          daysOpened={activeTerm.attendance?.daysOpened || 0}
          daysPresent={activeTerm.attendance?.daysPresent || 0}
          scores={activeTerm.scores || []}
          gradingKeys={gradingKeys}
          generalComment={activeTerm.comment?.generalComment}
          commentTeacherName={activeTerm.comment?.teacherName}
        />
      )}
    </div>
  );
}
