'use client';

/**
 * @file app/dashboard/admin/teacher-assignments/ManageTeacherAssignmentsClient.tsx
 * @description Client component for Managing Teacher Assignments in the Admin Dashboard.
 * Covers Part A (Subject Assignments per class) and Part B (Class Teacher designation per class).
 */

import { useState, useTransition } from 'react';
import {
  assignSubjectTeacherAction,
  unassignSubjectTeacherAction,
  setClassTeacherAction,
} from '@/app/dashboard/admin/actions';
import {
  BookOpen,
  UserCheck,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Info,
  School,
  User,
  GraduationCap,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { ClassItem, SubjectItem, Profile } from '@/lib/types/database';

export interface TeacherAssignmentPopulated {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  className: string;
  subjectName: string;
  teacherName: string;
}

export interface ClassWithTeacher extends ClassItem {
  class_teacher_id: string | null;
  classTeacherName?: string | null;
}

interface ManageTeacherAssignmentsClientProps {
  classes: ClassWithTeacher[];
  subjects: SubjectItem[];
  teachers: Profile[];
  assignments: TeacherAssignmentPopulated[];
}

export default function ManageTeacherAssignmentsClient({
  classes,
  subjects,
  teachers,
  assignments,
}: ManageTeacherAssignmentsClientProps) {
  const [activeTab, setActiveTab] = useState<'subject-assignments' | 'class-teacher'>('subject-assignments');

  // Form state for Part A (Subject Assignment)
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [subjectError, setSubjectError] = useState<string | null>(null);
  const [subjectSuccess, setSubjectSuccess] = useState<string | null>(null);

  // Form state for Part B (Class Teacher)
  const [classTeacherError, setClassTeacherError] = useState<string | null>(null);
  const [classTeacherSuccess, setClassTeacherSuccess] = useState<string | null>(null);
  // Accordion Expand/Collapse State for Part A Class Sections
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});

  const toggleClassSection = (classId: string) => {
    setExpandedClasses((prev) => ({
      ...prev,
      [classId]: !prev[classId],
    }));
  };

  const [isPending, startTransition] = useTransition();

  // --- Handlers for Part A: Subject Assignments ---
  const handleAssignSubjectTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    setSubjectError(null);
    setSubjectSuccess(null);

    if (!selectedClassId || !selectedSubjectId || !selectedTeacherId) {
      setSubjectError('Please select a class, subject, and teacher.');
      return;
    }

    startTransition(async () => {
      const res = await assignSubjectTeacherAction(
        selectedClassId,
        selectedSubjectId,
        selectedTeacherId
      );

      if (res.error) {
        setSubjectError(res.error);
      } else {
        const clsName = classes.find((c) => c.id === selectedClassId)?.name;
        const subName = subjects.find((s) => s.id === selectedSubjectId)?.name;
        const tName = teachers.find((t) => t.id === selectedTeacherId)?.full_name;

        setSubjectSuccess(
          `Assigned ${tName || 'Teacher'} to ${subName || 'Subject'} for ${clsName || 'Class'}.`
        );
        setSelectedSubjectId('');
        setSelectedTeacherId('');
      }
    });
  };

  const handleUnassignSubjectTeacher = (assignmentId: string, label: string) => {
    setSubjectError(null);
    setSubjectSuccess(null);

    startTransition(async () => {
      const res = await unassignSubjectTeacherAction(assignmentId);
      if (res.error) {
        setSubjectError(res.error);
      } else {
        setSubjectSuccess(`Removed assignment for ${label}.`);
      }
    });
  };

  // --- Handlers for Part B: Class Teacher Designation ---
  const handleSetClassTeacher = (classId: string, newTeacherId: string) => {
    setClassTeacherError(null);
    setClassTeacherSuccess(null);

    const targetTeacherId = newTeacherId === '' ? null : newTeacherId;

    startTransition(async () => {
      const res = await setClassTeacherAction(classId, targetTeacherId);
      if (res.error) {
        setClassTeacherError(res.error);
      } else {
        const clsName = classes.find((c) => c.id === classId)?.name;
        const tName = teachers.find((t) => t.id === targetTeacherId)?.full_name;

        if (targetTeacherId) {
          setClassTeacherSuccess(
            `Designated ${tName || 'Teacher'} as the Class Teacher for ${clsName || 'Class'}.`
          );
        } else {
          setClassTeacherSuccess(
            `Cleared Class Teacher designation for ${clsName || 'Class'}.`
          );
        }
      }
    });
  };

  // Group subject assignments by class
  const assignmentsByClass: Record<string, TeacherAssignmentPopulated[]> = {};
  classes.forEach((c) => {
    assignmentsByClass[c.id] = assignments.filter((a) => a.class_id === c.id);
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-olive-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-3 h-8 bg-schoolYellow-500 rounded-full" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-olive-900 tracking-tight">
              Manage Teacher Assignments
            </h1>
          </div>
          <p className="text-olive-700 text-sm font-medium">
            Assign subject teachers and designate class teachers across academic classes.
          </p>
        </div>

        {/* Tab Selector Controls */}
        <div className="flex items-center bg-olive-100/80 p-1.5 rounded-xl border border-olive-200 shrink-0">
          <button
            onClick={() => setActiveTab('subject-assignments')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'subject-assignments'
                ? 'bg-olive-800 text-white shadow-md'
                : 'text-olive-800 hover:bg-olive-200/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Subject Assignments</span>
          </button>
          <button
            onClick={() => setActiveTab('class-teacher')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'class-teacher'
                ? 'bg-olive-800 text-white shadow-md'
                : 'text-olive-800 hover:bg-olive-200/60'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Class Teachers</span>
          </button>
        </div>
      </div>

      {/* Informational Helper Line Banner */}
      <div className="p-4 bg-schoolYellow-50 border border-schoolYellow-200 rounded-xl flex items-start space-x-3 text-olive-900 text-sm">
        <Info className="w-5 h-5 text-schoolYellow-600 shrink-0 mt-0.5" />
        <span className="font-medium">
          The class teacher enters attendance, writes the general comment, and uploads the pupil's passport photo for this class.
        </span>
      </div>

      {/* Main Tab Content Card */}
      <div className="bg-white rounded-2xl border border-olive-200 shadow-sm p-6 sm:p-8">
        {/* ================= PART A: SUBJECT ASSIGNMENTS ================= */}
        {activeTab === 'subject-assignments' && (
          <div className="space-y-8">
            {/* Subject Assignment Form */}
            <form
              onSubmit={handleAssignSubjectTeacher}
              className="p-5 bg-olive-50 rounded-xl border border-olive-200 space-y-4"
            >
              <h2 className="text-xs font-bold uppercase tracking-wider text-olive-900 flex items-center space-x-1.5">
                <Plus className="w-4 h-4 text-olive-700" />
                <span>Assign Subject Teacher</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Select Class */}
                <div>
                  <label className="block text-xs font-semibold text-olive-800 mb-1">
                    Class
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-olive-300 rounded-lg text-sm font-medium text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
                  >
                    <option value="">-- Select Class --</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Subject */}
                <div>
                  <label className="block text-xs font-semibold text-olive-800 mb-1">
                    Subject
                  </label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-olive-300 rounded-lg text-sm font-medium text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
                  >
                    <option value="">-- Select Subject --</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Teacher (role === 'teacher') */}
                <div>
                  <label className="block text-xs font-semibold text-olive-800 mb-1">
                    Teacher
                  </label>
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-olive-300 rounded-lg text-sm font-medium text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
                  >
                    <option value="">-- Select Teacher --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name || 'Unnamed Teacher'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={
                    isPending ||
                    !selectedClassId ||
                    !selectedSubjectId ||
                    !selectedTeacherId
                  }
                  className="px-5 py-2.5 bg-schoolYellow-500 hover:bg-schoolYellow-400 text-olive-950 font-bold text-sm rounded-lg shadow-sm flex items-center space-x-2 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>Assign Teacher</span>
                </button>
              </div>
            </form>

            {/* Error / Success Feedback */}
            {subjectError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 text-red-800 text-sm">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <span className="font-medium">{subjectError}</span>
              </div>
            )}
            {subjectSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-3 text-emerald-800 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-medium">{subjectSuccess}</span>
              </div>
            )}

            {/* Grouped List View by Class */}
            <div className="space-y-6">
              <h2 className="text-lg font-extrabold text-olive-900 flex items-center space-x-2">
                <School className="w-5 h-5 text-olive-700" />
                <span>Current Subject Assignments by Class</span>
              </h2>

              {classes.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-olive-200 rounded-xl">
                  <p className="text-olive-700 font-semibold text-sm">
                    No classes configured yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {classes.map((cls) => {
                    const clsAssignments = assignmentsByClass[cls.id] || [];
                    const isExpanded = expandedClasses[cls.id] ?? false;

                    return (
                      <div
                        key={cls.id}
                        className="bg-white rounded-2xl border border-olive-200 shadow-sm overflow-hidden transition-all"
                      >
                        {/* Accordion Header */}
                        <button
                          type="button"
                          onClick={() => toggleClassSection(cls.id)}
                          className="w-full p-4 sm:p-5 bg-olive-50/80 hover:bg-olive-100/70 border-b border-olive-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors text-left cursor-pointer"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-olive-200/70 text-olive-900 rounded-lg shrink-0">
                              <GraduationCap className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2.5">
                                <h3 className="font-extrabold text-olive-900 text-base">
                                  {cls.name}
                                </h3>
                                <span className="px-2.5 py-0.5 bg-schoolYellow-100 border border-schoolYellow-300 text-olive-950 text-xs font-bold rounded-full font-mono">
                                  {clsAssignments.length} {clsAssignments.length === 1 ? 'assignment' : 'assignments'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 justify-between sm:justify-end">
                            {cls.classTeacherName ? (
                              <span className="text-xs font-bold bg-schoolYellow-100 text-olive-900 px-3 py-1 rounded-full border border-schoolYellow-200 flex items-center space-x-1 shrink-0">
                                <UserCheck className="w-3.5 h-3.5 text-schoolYellow-700" />
                                <span>Class Teacher: {cls.classTeacherName}</span>
                              </span>
                            ) : (
                              <span className="text-xs font-semibold bg-olive-50 text-olive-600 px-3 py-1 rounded-full border border-olive-200 shrink-0">
                                Class Teacher: Not assigned
                              </span>
                            )}

                            <div className="flex items-center space-x-1 text-olive-600 font-bold text-xs shrink-0">
                              <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
                              {isExpanded ? (
                                <ChevronDown className="w-5 h-5 text-olive-800" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-olive-800" />
                              )}
                            </div>
                          </div>
                        </button>

                        {/* Accordion Content Panel */}
                        {isExpanded && (
                          <div className="p-5 bg-white">
                            {clsAssignments.length === 0 ? (
                              <p className="text-xs text-olive-500 font-medium italic py-2">
                                No subject teachers assigned to this class yet.
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {clsAssignments.map((a) => (
                                  <div
                                    key={a.id}
                                    className="p-3.5 bg-olive-50/70 rounded-lg border border-olive-200 flex items-center justify-between gap-2"
                                  >
                                    <div>
                                      <p className="font-bold text-xs text-olive-950">
                                        {a.subjectName}
                                      </p>
                                      <p className="text-xs font-medium text-olive-700 mt-0.5 flex items-center space-x-1">
                                        <User className="w-3 h-3 text-olive-500" />
                                        <span>{a.teacherName}</span>
                                      </p>
                                    </div>
                                    <button
                                      onClick={() =>
                                        handleUnassignSubjectTeacher(
                                          a.id,
                                          `${a.teacherName} (${a.subjectName} - ${cls.name})`
                                        )
                                      }
                                      disabled={isPending}
                                      className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                                      title="Unassign Teacher"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= PART B: CLASS TEACHER DESIGNATION ================= */}
        {activeTab === 'class-teacher' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-schoolYellow-600" />
              <h2 className="text-lg font-bold text-olive-900">
                Designate Class Teachers
              </h2>
            </div>

            {/* Error / Success Feedback */}
            {classTeacherError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 text-red-800 text-sm">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <span className="font-medium">{classTeacherError}</span>
              </div>
            )}
            {classTeacherSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-3 text-emerald-800 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-medium">{classTeacherSuccess}</span>
              </div>
            )}

            {/* Classes List View for Class Teacher Assignment */}
            {classes.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-olive-200 rounded-xl">
                <p className="text-olive-700 font-semibold text-sm">
                  No classes configured yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="p-5 bg-white rounded-xl border border-olive-200 shadow-sm flex flex-col justify-between space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-olive-100 flex items-center justify-center shrink-0">
                          <GraduationCap className="w-4 h-4 text-olive-800" />
                        </div>
                        <h3 className="font-bold text-olive-900 text-base">
                          {cls.name}
                        </h3>
                      </div>

                      {cls.classTeacherName ? (
                        <span className="text-xs font-bold bg-schoolYellow-100 text-olive-950 px-3 py-1 rounded-full border border-schoolYellow-200">
                          Assigned
                        </span>
                      ) : (
                        <span className="text-xs font-semibold bg-olive-50 text-olive-600 px-3 py-1 rounded-full border border-olive-200">
                          Not assigned
                        </span>
                      )}
                    </div>

                    {/* Class Teacher Selector */}
                    <div>
                      <label className="block text-xs font-bold text-olive-800 uppercase mb-1.5">
                        Designated Class Teacher
                      </label>
                      <select
                        value={cls.class_teacher_id || ''}
                        onChange={(e) => handleSetClassTeacher(cls.id, e.target.value)}
                        disabled={isPending}
                        className="w-full px-3.5 py-2.5 bg-white border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500 disabled:opacity-50"
                      >
                        <option value="">-- Unassigned (None) --</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.full_name || 'Unnamed Teacher'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
