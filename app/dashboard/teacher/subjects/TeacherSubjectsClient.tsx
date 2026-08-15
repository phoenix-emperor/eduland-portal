'use client';

/**
 * @file app/dashboard/teacher/subjects/TeacherSubjectsClient.tsx
 * @description Client Component for Teacher Subject Assignments screen (TEACHER-ONLY).
 * Displays active subject assignments per class and provides a lightweight confirmation modal
 * to remove the teacher's own assignment from a class without affecting the underlying subject or scores.
 */

import { useState, useTransition } from 'react';
import { unassignMyselfAction } from '@/app/dashboard/teacher/actions';
import {
  BookOpen,
  UserX,
  Loader2,
  CheckCircle2,
  AlertCircle,
  School,
  X,
  Info,
} from 'lucide-react';

export interface AssignedClassInfo {
  assignmentId: string;
  classId: string;
  className: string;
}

export interface AssignedSubjectGroup {
  subjectId: string;
  subjectName: string;
  classes: AssignedClassInfo[];
}

interface TeacherSubjectsClientProps {
  assignedSubjects: AssignedSubjectGroup[];
}

interface SelectedTargetAssignment {
  assignmentId: string;
  subjectName: string;
  className: string;
}

export default function TeacherSubjectsClient({ assignedSubjects }: TeacherSubjectsClientProps) {
  // Confirmation Modal State
  const [targetAssignment, setTargetAssignment] = useState<SelectedTargetAssignment | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  // Open confirmation modal for a specific class assignment
  const handleOpenUnassignModal = (subjectName: string, cls: AssignedClassInfo) => {
    setTargetAssignment({
      assignmentId: cls.assignmentId,
      subjectName,
      className: cls.className,
    });
    setFeedbackSuccess(null);
    setFeedbackError(null);
  };

  // Close modal
  const handleCloseModal = () => {
    if (isPending) return;
    setTargetAssignment(null);
  };

  // Execute Unassign Handler
  const handleConfirmUnassign = () => {
    if (!targetAssignment) return;

    setFeedbackSuccess(null);
    setFeedbackError(null);

    startTransition(async () => {
      const res = await unassignMyselfAction(targetAssignment.assignmentId);

      if (res.error) {
        setFeedbackError(res.error);
      } else {
        setFeedbackSuccess(
          `Successfully removed your assignment for ${targetAssignment.subjectName} (${targetAssignment.className}).`
        );
        setTargetAssignment(null);
      }
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-olive-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-3 h-8 bg-schoolYellow-500 rounded-full" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-olive-900 tracking-tight">
              My Assigned Subjects
            </h1>
          </div>
          <p className="text-olive-700 text-sm font-medium">
            Teacher Portal — View your active subject assignments across classes and remove yourself if no longer teaching.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-olive-50 border border-olive-200 px-3.5 py-2 rounded-xl text-xs font-bold text-olive-800 shrink-0">
          <BookOpen className="w-4 h-4 text-schoolYellow-600" />
          <span>{assignedSubjects.length} Assigned {assignedSubjects.length === 1 ? 'Subject' : 'Subjects'}</span>
        </div>
      </div>

      {/* Alert Banners */}
      {feedbackSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-900 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{feedbackSuccess}</span>
        </div>
      )}

      {feedbackError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-red-900 text-sm font-semibold">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{feedbackError}</span>
        </div>
      )}

      {/* Assigned Subjects Grid / Empty State */}
      {assignedSubjects.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border-2 border-dashed border-olive-200 shadow-sm text-center">
          <div className="w-14 h-14 bg-olive-100 text-olive-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-olive-200">
            <BookOpen className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-extrabold text-olive-950 mb-1">
            No Assigned Subjects
          </h2>
          <p className="text-olive-700 text-sm font-medium max-w-md mx-auto">
            You are not currently assigned to teach any subjects.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignedSubjects.map((sub) => (
            <div
              key={sub.subjectId}
              className="bg-white rounded-2xl p-6 border border-olive-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-schoolYellow-100 text-olive-950 rounded-xl border border-schoolYellow-300 shrink-0">
                    <BookOpen className="w-5 h-5 text-olive-900" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-olive-950 text-base">
                      {sub.subjectName}
                    </h2>
                    <p className="text-2xs font-semibold text-olive-500">
                      {sub.classes.length} {sub.classes.length === 1 ? 'class assignment' : 'class assignments'}
                    </p>
                  </div>
                </div>

                {/* Class Assignment List */}
                <div className="space-y-2 pt-1">
                  <label className="text-3xs font-extrabold uppercase text-olive-600 tracking-wider block">
                    Assigned Classes & Actions:
                  </label>

                  <div className="space-y-2">
                    {sub.classes.map((cls) => (
                      <div
                        key={cls.assignmentId}
                        className="p-3 bg-olive-50/80 border border-olive-200 rounded-xl flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center space-x-2 text-xs font-bold text-olive-900">
                          <School className="w-3.5 h-3.5 text-olive-600 shrink-0" />
                          <span>{cls.className}</span>
                        </div>

                        {/* Remove My Assignment Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenUnassignModal(sub.subjectName, cls)}
                          disabled={isPending}
                          className="px-2.5 py-1 bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded-lg text-2xs font-bold transition-colors flex items-center space-x-1 cursor-pointer shrink-0 disabled:opacity-50"
                          title="Remove My Assignment"
                        >
                          <UserX className="w-3 h-3" />
                          <span>Remove My Assignment</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Light Unassign Confirmation Modal */}
      {targetAssignment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-olive-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 bg-olive-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2 font-extrabold text-base">
                <UserX className="w-5 h-5 text-schoolYellow-400 shrink-0" />
                <span>Remove Subject Assignment</span>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isPending}
                className="p-1 text-olive-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 font-medium leading-relaxed flex items-start space-x-3">
                <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  This removes you from teaching <span className="font-extrabold text-amber-950">{targetAssignment.subjectName}</span> for <span className="font-extrabold text-amber-950">{targetAssignment.className}</span>. An admin can reassign you later if this was a mistake.
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-olive-50 border-t border-olive-200 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isPending}
                className="px-4 py-2 bg-white hover:bg-olive-100 text-olive-900 font-bold text-xs rounded-xl border border-olive-300 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmUnassign}
                disabled={isPending}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserX className="w-4 h-4" />
                )}
                <span>Remove Assignment</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
