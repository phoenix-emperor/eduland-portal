'use client';

/**
 * @file app/dashboard/teacher/gradebook/GradebookClient.tsx
 * @description Client Component for Teacher Gradebook Entry screen.
 * Allows teachers to select an assigned Class + Subject and Term, view students,
 * enter/edit H/W, C/W, and Test scores (max 20 each), view live totals, and bulk-save.
 */

import { useState, useEffect, useTransition, useMemo } from 'react';
import {
  bulkSaveScoresAction,
  getGradebookStudentsAndScoresAction,
  ScoreInputItem,
} from '@/app/dashboard/teacher/actions';
import {
  BookOpen,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  Award,
  Search,
  Sparkles,
  Info,
} from 'lucide-react';

export interface TeacherAssignmentItem {
  id: string;
  class_id: string;
  class_name: string;
  subject_id: string;
  subject_name: string;
}

export interface TermItemOption {
  id: string;
  name: string;
  session: string;
  created_at: string;
}

interface GradebookClientProps {
  assignments: TeacherAssignmentItem[];
  terms: TermItemOption[];
}

interface LocalStudentScore {
  studentId: string;
  fullName: string;
  admissionNumber: string | null;
  hw: string; // Keep as string in local input state for seamless typing
  cw: string;
  test: string;
  isInitialSaved: boolean;
}

export default function GradebookClient({ assignments, terms }: GradebookClientProps) {
  // Selected Assignment & Term State
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>(
    assignments.length > 0 ? assignments[0].id : ''
  );
  const [selectedTermId, setSelectedTermId] = useState<string>(
    terms.length > 0 ? terms[0].id : ''
  );

  // Student list and scores local state
  const [studentsScores, setStudentsScores] = useState<LocalStudentScore[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [isPending, startTransition] = useTransition();

  // Find currently active assignment details
  const activeAssignment = useMemo(
    () => assignments.find((a) => a.id === selectedAssignmentId),
    [assignments, selectedAssignmentId]
  );

  // Load students & existing scores whenever Assignment or Term changes
  useEffect(() => {
    if (!activeAssignment || !selectedTermId) {
      setStudentsScores([]);
      return;
    }

    let isMounted = true;
    setLoadingData(true);
    setSaveSuccess(null);
    setSaveError(null);

    getGradebookStudentsAndScoresAction({
      classId: activeAssignment.class_id,
      subjectId: activeAssignment.subject_id,
      termId: selectedTermId,
    }).then((res) => {
      if (!isMounted) return;
      setLoadingData(false);

      if (res.students) {
        const localList: LocalStudentScore[] = res.students.map((st) => {
          const existing = res.scoresMap?.[st.id];
          return {
            studentId: st.id,
            fullName: st.full_name,
            admissionNumber: st.admission_number,
            hw: existing ? String(existing.hw) : '0',
            cw: existing ? String(existing.cw) : '0',
            test: existing ? String(existing.test) : '0',
            isInitialSaved: Boolean(existing),
          };
        });
        setStudentsScores(localList);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [activeAssignment, selectedTermId]);

  // Handle Score Input Change
  const handleScoreChange = (
    studentId: string,
    field: 'hw' | 'cw' | 'test',
    val: string
  ) => {
    setSaveSuccess(null);
    setSaveError(null);

    setStudentsScores((prev) =>
      prev.map((item) => {
        if (item.studentId === studentId) {
          return { ...item, [field]: val };
        }
        return item;
      })
    );
  };

  // Compute live filtered students for search
  const filteredStudents = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return studentsScores.filter(
      (s) =>
        s.fullName.toLowerCase().includes(term) ||
        (s.admissionNumber && s.admissionNumber.toLowerCase().includes(term))
    );
  }, [studentsScores, searchTerm]);

  // Client-side Validation helper (0 <= val <= 20)
  const validateScores = (): { valid: boolean; payload: ScoreInputItem[]; error?: string } => {
    const payload: ScoreInputItem[] = [];

    for (const item of studentsScores) {
      const hwNum = Number(item.hw);
      const cwNum = Number(item.cw);
      const testNum = Number(item.test);

      if (isNaN(hwNum) || hwNum < 0 || hwNum > 20) {
        return {
          valid: false,
          payload: [],
          error: `Invalid Homework score for ${item.fullName}. Scores must be numbers between 0 and 20.`,
        };
      }
      if (isNaN(cwNum) || cwNum < 0 || cwNum > 20) {
        return {
          valid: false,
          payload: [],
          error: `Invalid Classwork score for ${item.fullName}. Scores must be numbers between 0 and 20.`,
        };
      }
      if (isNaN(testNum) || testNum < 0 || testNum > 20) {
        return {
          valid: false,
          payload: [],
          error: `Invalid Test score for ${item.fullName}. Scores must be numbers between 0 and 20.`,
        };
      }

      payload.push({
        studentId: item.studentId,
        hw: hwNum,
        cw: cwNum,
        test: testNum,
      });
    }

    return { valid: true, payload };
  };

  // Save All Scores Handler
  const handleSaveAll = () => {
    setSaveSuccess(null);
    setSaveError(null);

    if (!activeAssignment || !selectedTermId) {
      setSaveError('Please select both a Class + Subject assignment and a Term.');
      return;
    }

    const { valid, payload, error: valErr } = validateScores();
    if (!valid) {
      setSaveError(valErr || 'Invalid scores entered.');
      return;
    }

    startTransition(async () => {
      const res = await bulkSaveScoresAction({
        classId: activeAssignment.class_id,
        subjectId: activeAssignment.subject_id,
        termId: selectedTermId,
        scores: payload,
      });

      if (res.error) {
        setSaveError(res.error);
      } else {
        setSaveSuccess(`Successfully saved gradebook scores for ${res.count || payload.length} students!`);
        // Mark all as initial saved
        setStudentsScores((prev) =>
          prev.map((item) => ({ ...item, isInitialSaved: true }))
        );
      }
    });
  };

  // ZERO-ASSIGNMENTS EMPTY STATE
  if (assignments.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl p-8 border border-olive-200 shadow-sm text-center">
          <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-300">
            <BookOpen className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-olive-950 mb-2">
            No Subjects Assigned
          </h2>
          <p className="text-olive-700 text-sm font-medium max-w-md mx-auto mb-6 leading-relaxed">
            You haven't been assigned to any subjects yet — contact your school administrator to assign you to your designated classes and subjects.
          </p>
          <div className="p-4 bg-olive-50 border border-olive-200 rounded-xl text-xs font-semibold text-olive-800 max-w-lg mx-auto flex items-center justify-center space-x-2">
            <Info className="w-4 h-4 text-olive-600 shrink-0" />
            <span>Once assigned by an admin, your subjects and classes will automatically appear here.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-olive-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-3 h-8 bg-schoolYellow-500 rounded-full" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-olive-900 tracking-tight">
              Gradebook Entry
            </h1>
          </div>
          <p className="text-olive-700 text-sm font-medium">
            Select your assigned subject and term to record Homework, Classwork, and Test scores.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-olive-50 border border-olive-200 px-3.5 py-2 rounded-xl text-xs font-bold text-olive-800 shrink-0">
          <Award className="w-4 h-4 text-schoolYellow-600" />
          <span>Max Score: 20 per assessment (Total 60)</span>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="bg-white rounded-2xl p-5 border border-olive-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Class + Subject Selector (Scoped strictly to teacher assignments) */}
        <div>
          <label className="block text-xs font-bold uppercase text-olive-900 mb-1.5 flex items-center space-x-1.5">
            <BookOpen className="w-4 h-4 text-olive-600" />
            <span>Assigned Class & Subject <span className="text-red-500">*</span></span>
          </label>
          <select
            value={selectedAssignmentId}
            onChange={(e) => setSelectedAssignmentId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-olive-300 rounded-xl text-sm font-bold text-olive-950 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
          >
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.class_name} — {a.subject_name}
              </option>
            ))}
          </select>
        </div>

        {/* Term Selector */}
        <div>
          <label className="block text-xs font-bold uppercase text-olive-900 mb-1.5 flex items-center space-x-1.5">
            <Calendar className="w-4 h-4 text-olive-600" />
            <span>School Term <span className="text-red-500">*</span></span>
          </label>
          <select
            value={selectedTermId}
            onChange={(e) => setSelectedTermId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-olive-300 rounded-xl text-sm font-bold text-olive-950 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
          >
            {terms.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.session})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status Feedback Alerts */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-900 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-red-900 text-sm font-semibold">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Gradebook Table Container */}
      <div className="bg-white rounded-2xl border border-olive-200 shadow-sm overflow-hidden">
        {/* Table Controls Header */}
        <div className="p-5 bg-olive-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-schoolYellow-500 text-olive-950 font-bold flex items-center justify-center">
              <Users className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-extrabold text-base tracking-tight">
                {activeAssignment ? `${activeAssignment.class_name} — ${activeAssignment.subject_name}` : 'Gradebook Table'}
              </h2>
              <p className="text-2xs text-olive-300 font-medium">
                {studentsScores.length} enrolled {studentsScores.length === 1 ? 'student' : 'students'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Search Filter */}
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-olive-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search student..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-olive-800 border border-olive-700 rounded-xl text-xs font-medium text-white placeholder-olive-400 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
              />
            </div>

            {/* Save All Action Button */}
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isPending || loadingData || studentsScores.length === 0}
              className="px-5 py-2 bg-schoolYellow-500 hover:bg-schoolYellow-400 text-olive-950 font-extrabold text-xs rounded-xl shadow-sm flex items-center space-x-2 shrink-0 disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save All Scores</span>
            </button>
          </div>
        </div>

        {/* Data Loading Spinner */}
        {loadingData ? (
          <div className="p-12 text-center text-olive-600 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-schoolYellow-600" />
            <p className="text-xs font-bold uppercase tracking-wider">Loading Class Roster & Scores...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-olive-500 text-xs font-medium italic">
            {studentsScores.length === 0
              ? 'No students currently enrolled in this class.'
              : 'No matching students found for search filter.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-olive-50 border-b border-olive-200 text-2xs font-extrabold uppercase text-olive-900 tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4 w-32 text-center">H/W (Max 20)</th>
                  <th className="py-3 px-4 w-32 text-center">C/W (Max 20)</th>
                  <th className="py-3 px-4 w-32 text-center">Test (Max 20)</th>
                  <th className="py-3 px-4 w-32 text-center">Total (Max 60)</th>
                  <th className="py-3 px-4 w-28 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-olive-100 text-xs">
                {filteredStudents.map((st, idx) => {
                  const hwNum = Number(st.hw) || 0;
                  const cwNum = Number(st.cw) || 0;
                  const testNum = Number(st.test) || 0;
                  const totalNum = hwNum + cwNum + testNum;

                  const isHwInvalid = isNaN(Number(st.hw)) || Number(st.hw) < 0 || Number(st.hw) > 20;
                  const isCwInvalid = isNaN(Number(st.cw)) || Number(st.cw) < 0 || Number(st.cw) > 20;
                  const isTestInvalid = isNaN(Number(st.test)) || Number(st.test) < 0 || Number(st.test) > 20;
                  const hasInvalidScore = isHwInvalid || isCwInvalid || isTestInvalid;

                  return (
                    <tr key={st.studentId} className="hover:bg-olive-50/50 transition-colors">
                      <td className="py-3 px-4 text-center font-bold text-olive-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-olive-950 text-sm">
                          {st.fullName}
                        </div>
                        {st.admissionNumber && (
                          <div className="text-2xs text-olive-500 font-mono">
                            Adm: {st.admissionNumber}
                          </div>
                        )}
                      </td>

                      {/* H/W Input */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min={0}
                          max={20}
                          value={st.hw}
                          onChange={(e) => handleScoreChange(st.studentId, 'hw', e.target.value)}
                          className={`w-20 px-2.5 py-1.5 text-center font-mono font-bold text-sm border rounded-xl focus:outline-none focus:ring-2 ${
                            isHwInvalid
                              ? 'border-red-500 bg-red-50 text-red-900 focus:ring-red-500'
                              : 'border-olive-300 text-olive-950 focus:ring-schoolYellow-500 bg-white'
                          }`}
                        />
                      </td>

                      {/* C/W Input */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min={0}
                          max={20}
                          value={st.cw}
                          onChange={(e) => handleScoreChange(st.studentId, 'cw', e.target.value)}
                          className={`w-20 px-2.5 py-1.5 text-center font-mono font-bold text-sm border rounded-xl focus:outline-none focus:ring-2 ${
                            isCwInvalid
                              ? 'border-red-500 bg-red-50 text-red-900 focus:ring-red-500'
                              : 'border-olive-300 text-olive-950 focus:ring-schoolYellow-500 bg-white'
                          }`}
                        />
                      </td>

                      {/* Test Input */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min={0}
                          max={20}
                          value={st.test}
                          onChange={(e) => handleScoreChange(st.studentId, 'test', e.target.value)}
                          className={`w-20 px-2.5 py-1.5 text-center font-mono font-bold text-sm border rounded-xl focus:outline-none focus:ring-2 ${
                            isTestInvalid
                              ? 'border-red-500 bg-red-50 text-red-900 focus:ring-red-500'
                              : 'border-olive-300 text-olive-950 focus:ring-schoolYellow-500 bg-white'
                          }`}
                        />
                      </td>

                      {/* Total (Live Read-Only) */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-xl text-sm font-mono font-black border ${
                          hasInvalidScore
                            ? 'bg-red-100 text-red-900 border-red-300'
                            : 'bg-olive-100 text-olive-950 border-olive-300'
                        }`}>
                          {hasInvalidScore ? 'ERR' : totalNum}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4 text-center">
                        {hasInvalidScore ? (
                          <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-2xs font-extrabold">
                            Invalid
                          </span>
                        ) : st.isInitialSaved ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-2xs font-bold">
                            Saved
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded text-2xs font-bold">
                            Draft
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 bg-olive-50 border-t border-olive-200 flex items-center justify-between">
          <div className="text-2xs font-medium text-olive-700">
            Note: Total score is automatically computed and saved in the database.
          </div>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isPending || loadingData || studentsScores.length === 0}
            className="px-6 py-2.5 bg-schoolYellow-500 hover:bg-schoolYellow-400 text-olive-950 font-extrabold text-xs rounded-xl shadow-sm flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save All Scores</span>
          </button>
        </div>
      </div>
    </div>
  );
}
