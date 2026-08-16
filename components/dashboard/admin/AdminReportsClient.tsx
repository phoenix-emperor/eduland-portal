'use client';

/**
 * @file components/dashboard/admin/AdminReportsClient.tsx
 * @description Client Component for Admin "View Student Report" View.
 * Provides a searchable student combobox across all students in the school,
 * term selector showing terms with real data (most recent first),
 * and renders full report card sheets using the shared ReportSheetCard component.
 * Accessible to both School Admin and Super Admin roles.
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  User,
  Calendar,
  FileText,
  Clock,
  ChevronDown,
  GraduationCap,
  Sparkles,
  X,
} from 'lucide-react';
import ReportSheetCard from '@/components/dashboard/parent/ReportSheetCard';
import {
  GradingKeyItem,
} from '@/components/dashboard/parent/ParentReportClient';
import {
  StudentHistoryData,
  HistoricalTermReport,
} from '@/components/dashboard/parent/ParentHistoryClient';

export interface AdminStudentReportData extends StudentHistoryData {
  admissionNumber?: string | null;
}

interface AdminReportsClientProps {
  students: AdminStudentReportData[];
  gradingKeys: GradingKeyItem[];
}

export default function AdminReportsClient({
  students,
  gradingKeys,
}: AdminReportsClientProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter students based on search query (Name or Admission Number)
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase().trim();
    return students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        (s.admissionNumber && s.admissionNumber.toLowerCase().includes(q)) ||
        (s.currentClassName && s.currentClassName.toLowerCase().includes(q))
    );
  }, [students, searchQuery]);

  const activeStudent = useMemo(() => {
    return students.find((s) => s.studentId === selectedStudentId) || null;
  }, [students, selectedStudentId]);

  // Selected term state (defaults to student's first term / most recent)
  const [selectedTermId, setSelectedTermId] = useState<string>('');

  // Handle student selection
  const handleSelectStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
    setIsDropdownOpen(false);
    const targetStudent = students.find((s) => s.studentId === studentId);
    if (targetStudent && targetStudent.terms.length > 0) {
      setSelectedTermId(targetStudent.terms[0].termId);
    } else {
      setSelectedTermId('');
    }
  };

  const activeTerm: HistoricalTermReport | null = useMemo(() => {
    if (!activeStudent || activeStudent.terms.length === 0) return null;
    return (
      activeStudent.terms.find((t) => t.termId === selectedTermId) ||
      activeStudent.terms[0]
    );
  }, [activeStudent, selectedTermId]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-olive-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center space-x-2 text-olive-950 font-black text-xl">
            <FileText className="w-6 h-6 text-schoolYellow-600" />
            <span>Student Academic Reports</span>
          </div>
          <p className="text-xs text-olive-700 font-medium mt-0.5">
            Search and view official report cards for any student across current and historical academic terms.
          </p>
        </div>

        <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-olive-50 text-olive-900 rounded-xl border border-olive-200 text-xs font-bold shrink-0">
          <Sparkles className="w-4 h-4 text-schoolYellow-600" />
          <span>School Admin View</span>
        </div>
      </div>

      {/* Searchable Student Picker & Term Selector Bar */}
      <div className="bg-white rounded-2xl p-4 border border-olive-200 shadow-sm space-y-4 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* Searchable Student Combobox Dropdown */}
          <div className="space-y-1.5 relative" ref={dropdownRef}>
            <label className="text-xs font-bold text-olive-800 flex items-center space-x-1.5">
              <User className="w-4 h-4 text-schoolYellow-600" />
              <span>Select Pupil / Search Student:</span>
            </label>

            {/* Input Trigger Box */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-olive-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={
                  isDropdownOpen
                    ? searchQuery
                    : activeStudent
                    ? `${activeStudent.fullName} (${activeStudent.admissionNumber || 'No Adm #'})`
                    : searchQuery
                }
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (!isDropdownOpen) setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder="Search by student name or admission number..."
                className="w-full pl-9 pr-10 py-2.5 bg-olive-50/60 border border-olive-200 rounded-xl text-xs font-bold text-olive-950 placeholder-olive-400 focus:outline-none focus:ring-2 focus:ring-schoolYellow-400 focus:bg-white transition-all"
              />

              {activeStudent && !isDropdownOpen ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudentId('');
                    setSearchQuery('');
                    setIsDropdownOpen(true);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-olive-500 hover:text-olive-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-olive-500">
                  <ChevronDown className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Search Dropdown Popup */}
            {isDropdownOpen && (
              <div className="absolute z-30 left-0 right-0 mt-1 bg-white rounded-xl border border-olive-200 shadow-xl max-h-60 overflow-y-auto divide-y divide-olive-100">
                {filteredStudents.length === 0 ? (
                  <div className="p-4 text-center text-xs text-olive-500 font-semibold">
                    No matching students found.
                  </div>
                ) : (
                  filteredStudents.map((st) => (
                    <button
                      key={st.studentId}
                      type="button"
                      onClick={() => handleSelectStudent(st.studentId)}
                      className={`w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between hover:bg-olive-50 transition-colors cursor-pointer ${
                        st.studentId === selectedStudentId
                          ? 'bg-olive-100/80 text-olive-950 font-black'
                          : 'text-olive-900'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="w-4 h-4 text-schoolYellow-600 shrink-0" />
                        <div>
                          <span className="block text-olive-950">{st.fullName}</span>
                          <span className="text-3xs font-semibold text-olive-600">
                            Adm: {st.admissionNumber || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-olive-100 text-olive-900 rounded-md text-3xs font-extrabold border border-olive-200">
                        {st.currentClassName}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Student Status Summary */}
          {activeStudent && (
            <div className="p-3 bg-olive-50/70 rounded-xl border border-olive-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-3xs font-bold uppercase text-olive-600 block">Selected Pupil:</span>
                <span className="font-extrabold text-olive-950 text-sm">{activeStudent.fullName}</span>
              </div>
              <div className="text-right">
                <span className="text-3xs font-bold uppercase text-olive-600 block">Current Class:</span>
                <span className="font-bold text-olive-900">{activeStudent.currentClassName}</span>
              </div>
            </div>
          )}
        </div>

        {/* Term List Selector for Active Student (Sorted Most Recent First) */}
        {activeStudent && activeStudent.terms.length > 0 && (
          <div className="pt-3 border-t border-olive-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-olive-800 shrink-0">
              <Calendar className="w-4 h-4 text-schoolYellow-600" />
              <span>Select Academic Term (Most Recent First):</span>
            </div>

            <div className="flex items-center space-x-2 overflow-x-auto">
              {activeStudent.terms.map((termItem) => (
                <button
                  key={termItem.termId}
                  type="button"
                  onClick={() => setSelectedTermId(termItem.termId)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center space-x-1.5 ${
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

      {/* Main Report Card Display / Empty States */}
      {!selectedStudentId || !activeStudent ? (
        /* Empty State 1: No student selected yet */
        <div className="bg-white rounded-2xl p-12 border border-olive-200 shadow-sm text-center space-y-4 print:hidden">
          <div className="w-16 h-16 bg-olive-100 text-olive-800 rounded-2xl flex items-center justify-center mx-auto border border-olive-200">
            <Search className="w-8 h-8 text-schoolYellow-600" />
          </div>
          <h2 className="text-xl font-extrabold text-olive-950">
            Select a Student to View Report
          </h2>
          <p className="text-olive-700 text-sm font-medium max-w-md mx-auto leading-relaxed">
            Use the searchable dropdown above to search by student name or admission number and view their official academic report card.
          </p>
        </div>
      ) : activeStudent.terms.length === 0 || !activeTerm ? (
        /* Empty State 2: Selected student has no recorded term reports */
        <div className="bg-white rounded-2xl p-12 border border-olive-200 shadow-sm text-center space-y-3 print:hidden">
          <Clock className="w-12 h-12 text-olive-400 mx-auto" />
          <h3 className="text-lg font-extrabold text-olive-950">
            No Term Reports Found
          </h3>
          <p className="text-olive-700 text-sm font-medium max-w-md mx-auto">
            No academic scores or comments have been recorded for <span className="font-bold text-olive-900">{activeStudent.fullName}</span> across any terms yet.
          </p>
        </div>
      ) : (
        /* Active Report Card Sheet */
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
