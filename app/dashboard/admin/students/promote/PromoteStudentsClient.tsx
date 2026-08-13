'use client';

/**
 * @file app/dashboard/admin/students/promote/PromoteStudentsClient.tsx
 * @description Client component for promoting and transferring students between classes.
 * Enables class selection, multi-student selection, enrollment session tagging, and displays
 * success confirmation upon completing transfers.
 */

import { useState, useTransition } from 'react';
import { moveStudentsAction } from '@/app/dashboard/admin/actions';
import {
  Users,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UserCheck,
  Calendar,
  Sparkles,
  School,
} from 'lucide-react';
import { ClassItem, StudentItem } from '@/lib/types/database';

interface PromoteStudentsClientProps {
  classes: ClassItem[];
  students: StudentItem[];
  sessions: string[];
}

export default function PromoteStudentsClient({
  classes,
  students,
  sessions,
}: PromoteStudentsClientProps) {
  const [sourceClassId, setSourceClassId] = useState<string>('');
  const [targetClassId, setTargetClassId] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<string>(
    sessions.length > 0 ? sessions[0] : ''
  );

  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    movedStudents: StudentItem[];
    targetClassName: string;
    session: string;
  } | null>(null);

  const [isPending, startTransition] = useTransition();

  // Filter students by selected source class
  const availableStudents = students.filter(
    (s) => s.class_id === sourceClassId
  );

  const handleSourceClassChange = (classId: string) => {
    setSourceClassId(classId);
    setSelectedStudentIds([]);
    setError(null);
    setSuccessResult(null);
    if (targetClassId === classId) {
      setTargetClassId('');
    }
  };

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.length === availableStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(availableStudents.map((s) => s.id));
    }
  };

  const handleConfirmMove = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessResult(null);

    if (!sourceClassId) {
      setError('Please select a source class.');
      return;
    }

    if (!targetClassId) {
      setError('Please select a target destination class.');
      return;
    }

    if (sourceClassId === targetClassId) {
      setError('Target class must be different from current source class.');
      return;
    }

    if (!selectedSession) {
      setError('Please select a session.');
      return;
    }

    if (selectedStudentIds.length === 0) {
      setError('Please select at least one student to move.');
      return;
    }

    startTransition(async () => {
      const res = await moveStudentsAction(
        selectedStudentIds,
        sourceClassId,
        targetClassId,
        selectedSession
      );

      if (res.error) {
        setError(res.error);
      } else {
        const movedList = students.filter((s) =>
          selectedStudentIds.includes(s.id)
        );
        const targetCls = classes.find((c) => c.id === targetClassId);

        setSuccessResult({
          movedStudents: movedList,
          targetClassName: targetCls?.name || 'New Class',
          session: selectedSession,
        });

        // Reset selections
        setSelectedStudentIds([]);
      }
    });
  };

  const sourceClass = classes.find((c) => c.id === sourceClassId);
  const targetClass = classes.find((c) => c.id === targetClassId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-olive-200 shadow-sm">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-3 h-8 bg-schoolYellow-500 rounded-full" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-olive-900 tracking-tight">
            Promote & Move Students Between Classes
          </h1>
        </div>
        <p className="text-olive-700 text-sm font-medium">
          Transfer students to a new class while preserving their historical enrollment records for the current academic session.
        </p>
      </div>

      {/* Main Workflow Form */}
      <div className="bg-white rounded-2xl border border-olive-200 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleConfirmMove} className="space-y-8">
          {/* Step 1: Select Source Class, Target Class, and Session */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Source Class */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-olive-900 flex items-center space-x-1.5">
                <School className="w-4 h-4 text-olive-700" />
                <span>1. Source Class (Current)</span>
              </label>
              <select
                value={sourceClassId}
                onChange={(e) => handleSourceClassChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
              >
                <option value="">-- Select Source Class --</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Class */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-olive-900 flex items-center space-x-1.5">
                <ArrowRight className="w-4 h-4 text-schoolYellow-600" />
                <span>2. Target Class (Destination)</span>
              </label>
              <select
                value={targetClassId}
                onChange={(e) => {
                  setTargetClassId(e.target.value);
                  setError(null);
                }}
                disabled={!sourceClassId}
                className="w-full px-3.5 py-2.5 bg-white border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500 disabled:opacity-50 disabled:bg-olive-50"
              >
                <option value="">-- Select Target Class --</option>
                {classes
                  .filter((cls) => cls.id !== sourceClassId)
                  .map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Historical Enrollment Session */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-olive-900 flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-olive-700" />
                <span>3. Session</span>
              </label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
              >
                {sessions.length === 0 ? (
                  <option value="">No sessions configured</option>
                ) : (
                  sessions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Step 2: Student Selection Area */}
          {sourceClassId && (
            <div className="space-y-4 pt-4 border-t border-olive-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-olive-900 text-base flex items-center space-x-2">
                    <Users className="w-5 h-5 text-olive-700" />
                    <span>
                      Select Students from {sourceClass?.name} ({availableStudents.length} Available)
                    </span>
                  </h3>
                  <p className="text-xs text-olive-600 mt-0.5">
                    Check the students you wish to transfer to {targetClass?.name || 'the target class'}.
                  </p>
                </div>

                {availableStudents.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-3 py-1.5 border border-olive-200 hover:bg-olive-50 rounded-lg text-xs font-bold text-olive-800 transition-colors cursor-pointer"
                  >
                    {selectedStudentIds.length === availableStudents.length
                      ? 'Deselect All'
                      : 'Select All Students'}
                  </button>
                )}
              </div>

              {availableStudents.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-olive-200 rounded-xl bg-olive-50/50">
                  <Users className="w-10 h-10 text-olive-400 mx-auto mb-2" />
                  <p className="text-olive-700 font-semibold text-sm">
                    No students currently enrolled in {sourceClass?.name}.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availableStudents.map((student) => {
                    const isSelected = selectedStudentIds.includes(student.id);
                    return (
                      <div
                        key={student.id}
                        onClick={() => handleToggleStudent(student.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-olive-900 text-white border-olive-900 shadow-sm'
                            : 'bg-white text-olive-900 border-olive-200 hover:border-olive-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-schoolYellow-500 border-schoolYellow-500 text-olive-950'
                                : 'border-olive-300 bg-white'
                            }`}
                          >
                            {isSelected && <UserCheck className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <span className="font-semibold text-sm">
                            {student.full_name}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Feedback & Error Alerts */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 text-red-800 text-sm">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {successResult && (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2 text-emerald-900 font-bold text-base">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <span>Successfully Moved {successResult.movedStudents.length} Students!</span>
              </div>
              <p className="text-sm text-emerald-800 font-medium">
                The students below have been moved to{' '}
                <strong className="text-emerald-950">{successResult.targetClassName}</strong> and an enrollment record for session{' '}
                <strong className="text-emerald-950">{successResult.session}</strong> was created for their previous class.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {successResult.movedStudents.map((s) => (
                  <span
                    key={s.id}
                    className="px-3 py-1 bg-white border border-emerald-300 text-emerald-900 rounded-lg text-xs font-bold shadow-2xs"
                  >
                    {s.full_name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Submit Action */}
          {sourceClassId && availableStudents.length > 0 && (
            <div className="pt-4 border-t border-olive-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={
                  isPending ||
                  !sourceClassId ||
                  !targetClassId ||
                  selectedStudentIds.length === 0
                }
                className="px-6 py-3 bg-schoolYellow-500 hover:bg-schoolYellow-400 text-olive-950 font-bold text-sm rounded-xl shadow-md flex items-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing Transfer...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>
                      Confirm Move ({selectedStudentIds.length} Selected)
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
