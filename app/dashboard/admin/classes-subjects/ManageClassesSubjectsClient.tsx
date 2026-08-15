'use client';

/**
 * @file app/dashboard/admin/classes-subjects/ManageClassesSubjectsClient.tsx
 * @description Client component for Managing Classes and Subjects in the Admin Dashboard.
 * Supports list views with live counts, inline/modal renaming, creation validation,
 * and Super-Admin exclusive class deletion with safety constraint handling.
 */

import { useState, useTransition } from 'react';
import {
  createClassAction,
  renameClassAction,
  deleteClassAction,
  createSubjectAction,
  renameSubjectAction,
  deleteSubjectAction,
} from '@/app/dashboard/admin/actions';
import {
  BookOpen,
  GraduationCap,
  Plus,
  Pencil,
  Trash2,
  Users,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { UserRole } from '@/lib/types/database';

export interface ClassWithCount {
  id: string;
  name: string;
  studentCount: number;
}

export interface SubjectWithCount {
  id: string;
  name: string;
  assignmentCount: number;
}

interface ManageClassesSubjectsClientProps {
  initialClasses: ClassWithCount[];
  initialSubjects: SubjectWithCount[];
  userRole: UserRole;
}

export default function ManageClassesSubjectsClient({
  initialClasses,
  initialSubjects,
  userRole,
}: ManageClassesSubjectsClientProps) {
  const [activeTab, setActiveTab] = useState<'classes' | 'subjects'>('classes');

  // Class Form & Edit state
  const [classNameInput, setClassNameInput] = useState('');
  const [classError, setClassError] = useState<string | null>(null);
  const [classSuccess, setClassSuccess] = useState<string | null>(null);
  const [editingClass, setEditingClass] = useState<ClassWithCount | null>(null);
  const [renameClassName, setRenameClassName] = useState('');
  const [deletingClass, setDeletingClass] = useState<ClassWithCount | null>(null);

  // Subject Form & Edit state
  const [subjectNameInput, setSubjectNameInput] = useState('');
  const [subjectError, setSubjectError] = useState<string | null>(null);
  const [subjectSuccess, setSubjectSuccess] = useState<string | null>(null);
  const [editingSubject, setEditingSubject] = useState<SubjectWithCount | null>(null);
  const [renameSubjectName, setRenameSubjectName] = useState('');
  const [deletingSubject, setDeletingSubject] = useState<SubjectWithCount | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  const [isPending, startTransition] = useTransition();

  const isSuperAdmin = userRole === 'super_admin';

  // --- Handlers for Classes ---
  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    setClassError(null);
    setClassSuccess(null);

    const trimmed = classNameInput.trim();
    if (!trimmed) {
      setClassError('Please enter a class name.');
      return;
    }

    startTransition(async () => {
      const res = await createClassAction(trimmed);
      if (res.error) {
        setClassError(res.error);
      } else {
        setClassSuccess(`Class "${trimmed}" created successfully.`);
        setClassNameInput('');
      }
    });
  };

  const handleRenameClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;
    setClassError(null);
    setClassSuccess(null);

    const trimmed = renameClassName.trim();
    if (!trimmed) {
      setClassError('Class name cannot be empty.');
      return;
    }

    startTransition(async () => {
      const res = await renameClassAction(editingClass.id, trimmed);
      if (res.error) {
        setClassError(res.error);
      } else {
        setClassSuccess(`Class renamed to "${trimmed}" successfully.`);
        setEditingClass(null);
      }
    });
  };

  const handleDeleteClassConfirm = () => {
    if (!deletingClass) return;
    setClassError(null);
    setClassSuccess(null);

    startTransition(async () => {
      const res = await deleteClassAction(deletingClass.id, deletingClass.name);
      if (res.error) {
        setClassError(res.error);
      } else {
        setClassSuccess(`Class "${deletingClass.name}" deleted successfully.`);
      }
      setDeletingClass(null);
    });
  };

  // --- Handlers for Subjects ---
  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    setSubjectError(null);
    setSubjectSuccess(null);

    const trimmed = subjectNameInput.trim();
    if (!trimmed) {
      setSubjectError('Please enter a subject name.');
      return;
    }

    startTransition(async () => {
      const res = await createSubjectAction(trimmed);
      if (res.error) {
        setSubjectError(res.error);
      } else {
        setSubjectSuccess(`Subject "${trimmed}" created successfully.`);
        setSubjectNameInput('');
      }
    });
  };

  const handleRenameSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;
    setSubjectError(null);
    setSubjectSuccess(null);

    const trimmed = renameSubjectName.trim();
    if (!trimmed) {
      setSubjectError('Subject name cannot be empty.');
      return;
    }

    startTransition(async () => {
      const res = await renameSubjectAction(editingSubject.id, trimmed);
      if (res.error) {
        setSubjectError(res.error);
      } else {
        setSubjectSuccess(`Subject renamed to "${trimmed}" successfully.`);
        setEditingSubject(null);
      }
    });
  };

  const handleDeleteSubjectConfirm = () => {
    if (!deletingSubject) return;
    setSubjectError(null);
    setSubjectSuccess(null);

    startTransition(async () => {
      const res = await deleteSubjectAction(deletingSubject.id, deletingSubject.name);
      if (res.error) {
        setSubjectError(res.error);
      } else {
        setSubjectSuccess(`Subject "${deletingSubject.name}" deleted successfully.`);
      }
      setDeletingSubject(null);
    });
  };

  const filteredClasses = initialClasses.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSubjects = initialSubjects.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-olive-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-3 h-8 bg-schoolYellow-500 rounded-full" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-olive-900 tracking-tight">
              Manage Classes & Subjects
            </h1>
          </div>
          <p className="text-olive-700 text-sm font-medium">
            Configure academic classes and subject offerings for your school.
          </p>
        </div>

        {/* Tab Selector Buttons */}
        <div className="flex items-center bg-olive-100/80 p-1.5 rounded-xl border border-olive-200 shrink-0">
          <button
            onClick={() => {
              setActiveTab('classes');
              setSearchQuery('');
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'classes'
                ? 'bg-olive-800 text-white shadow-md'
                : 'text-olive-800 hover:bg-olive-200/60'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Classes ({initialClasses.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('subjects');
              setSearchQuery('');
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'subjects'
                ? 'bg-olive-800 text-white shadow-md'
                : 'text-olive-800 hover:bg-olive-200/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Subjects ({initialSubjects.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl border border-olive-200 shadow-sm p-6 sm:p-8">
        {/* Search & Filter Bar */}
        <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-olive-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-olive-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-schoolYellow-500 bg-white"
            />
          </div>
        </div>

        {/* ================= CLASSES TAB ================= */}
        {activeTab === 'classes' && (
          <div className="space-y-6">
            {/* Create Class Form */}
            <form
              onSubmit={handleCreateClass}
              className="p-4 sm:p-5 bg-olive-50 rounded-xl border border-olive-200 flex flex-col sm:flex-row items-stretch sm:items-end gap-3"
            >
              <div className="flex-1">
                <label
                  htmlFor="class-name-input"
                  className="block text-xs font-bold uppercase tracking-wider text-olive-800 mb-1.5"
                >
                  Create New Class
                </label>
                <input
                  id="class-name-input"
                  type="text"
                  placeholder="e.g. Primary 1A, Grade 7, SS3 Science"
                  value={classNameInput}
                  onChange={(e) => setClassNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-olive-300 rounded-lg text-sm text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
                />
              </div>
              <button
                type="submit"
                disabled={isPending || !classNameInput.trim()}
                className="px-5 py-2.5 bg-schoolYellow-500 hover:bg-schoolYellow-400 text-olive-950 font-bold text-sm rounded-lg shadow-sm flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>Add Class</span>
              </button>
            </form>

            {/* Error / Success Feedback */}
            {classError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 text-red-800 text-sm">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <span className="font-medium">{classError}</span>
              </div>
            )}
            {classSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-3 text-emerald-800 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-medium">{classSuccess}</span>
              </div>
            )}

            {/* Classes List View */}
            {filteredClasses.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-olive-200 rounded-xl">
                <GraduationCap className="w-12 h-12 text-olive-400 mx-auto mb-3" />
                <p className="text-olive-700 font-semibold text-base">
                  {searchQuery ? 'No classes match your search.' : 'No classes configured yet.'}
                </p>
                <p className="text-olive-500 text-sm mt-1">
                  Use the form above to add your first class.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="p-5 bg-white rounded-xl border border-olive-200 hover:border-olive-300 shadow-sm flex flex-col justify-between transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-lg bg-olive-100 flex items-center justify-center shrink-0">
                            <GraduationCap className="w-4 h-4 text-olive-800" />
                          </div>
                          <h3 className="font-bold text-olive-900 text-base">
                            {cls.name}
                          </h3>
                        </div>
                      </div>

                      {/* Live Count */}
                      <div className="flex items-center space-x-2 text-xs font-semibold text-olive-700 bg-olive-50 px-3 py-1.5 rounded-lg border border-olive-100 w-fit mb-4">
                        <Users className="w-3.5 h-3.5 text-olive-600" />
                        <span>
                          {cls.studentCount}{' '}
                          {cls.studentCount === 1 ? 'Student' : 'Students'} Enrolled
                        </span>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex items-center justify-end space-x-2 pt-3 border-t border-olive-100">
                      <button
                        onClick={() => {
                          setEditingClass(cls);
                          setRenameClassName(cls.name);
                        }}
                        className="p-1.5 text-olive-700 hover:text-olive-900 hover:bg-olive-100 rounded-lg transition-colors cursor-pointer flex items-center space-x-1 text-xs font-semibold"
                        title="Rename Class"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Rename</span>
                      </button>

                      {/* Super Admin Only Delete Button */}
                      {isSuperAdmin && (
                        <button
                          onClick={() => setDeletingClass(cls)}
                          className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex items-center space-x-1 text-xs font-semibold"
                          title="Delete Class (Super Admin Only)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= SUBJECTS TAB ================= */}
        {activeTab === 'subjects' && (
          <div className="space-y-6">
            {/* Create Subject Form */}
            <form
              onSubmit={handleCreateSubject}
              className="p-4 sm:p-5 bg-olive-50 rounded-xl border border-olive-200 flex flex-col sm:flex-row items-stretch sm:items-end gap-3"
            >
              <div className="flex-1">
                <label
                  htmlFor="subject-name-input"
                  className="block text-xs font-bold uppercase tracking-wider text-olive-800 mb-1.5"
                >
                  Create New Subject
                </label>
                <input
                  id="subject-name-input"
                  type="text"
                  placeholder="e.g. Mathematics, English Language, Physics"
                  value={subjectNameInput}
                  onChange={(e) => setSubjectNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-olive-300 rounded-lg text-sm text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
                />
              </div>
              <button
                type="submit"
                disabled={isPending || !subjectNameInput.trim()}
                className="px-5 py-2.5 bg-schoolYellow-500 hover:bg-schoolYellow-400 text-olive-950 font-bold text-sm rounded-lg shadow-sm flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>Add Subject</span>
              </button>
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

            {/* Subjects List View */}
            {filteredSubjects.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-olive-200 rounded-xl">
                <BookOpen className="w-12 h-12 text-olive-400 mx-auto mb-3" />
                <p className="text-olive-700 font-semibold text-base">
                  {searchQuery ? 'No subjects match your search.' : 'No subjects configured yet.'}
                </p>
                <p className="text-olive-500 text-sm mt-1">
                  Use the form above to add your first subject.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSubjects.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-5 bg-white rounded-xl border border-olive-200 hover:border-olive-300 shadow-sm flex flex-col justify-between transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-lg bg-schoolYellow-100 flex items-center justify-center shrink-0">
                            <BookOpen className="w-4 h-4 text-olive-900" />
                          </div>
                          <h3 className="font-bold text-olive-900 text-base">
                            {sub.name}
                          </h3>
                        </div>
                      </div>

                      {/* Live Count */}
                      <div className="flex items-center space-x-2 text-xs font-semibold text-olive-700 bg-olive-50 px-3 py-1.5 rounded-lg border border-olive-100 w-fit mb-4">
                        <Users className="w-3.5 h-3.5 text-olive-600" />
                        <span>
                          {sub.assignmentCount}{' '}
                          {sub.assignmentCount === 1 ? 'Teacher Assignment' : 'Teacher Assignments'}
                        </span>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex items-center justify-end space-x-2 pt-3 border-t border-olive-100">
                      <button
                        onClick={() => {
                          setEditingSubject(sub);
                          setRenameSubjectName(sub.name);
                        }}
                        className="p-1.5 text-olive-700 hover:text-olive-900 hover:bg-olive-100 rounded-lg transition-colors cursor-pointer flex items-center space-x-1 text-xs font-semibold"
                        title="Rename Subject"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Rename</span>
                      </button>

                      {/* Super Admin Only Delete Button */}
                      {isSuperAdmin && (
                        <button
                          onClick={() => setDeletingSubject(sub)}
                          className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex items-center space-x-1 text-xs font-semibold"
                          title="Delete Subject (Super Admin Only)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Rename Class */}
      {editingClass && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-olive-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-olive-900 flex items-center space-x-2">
                <Pencil className="w-4 h-4 text-schoolYellow-600" />
                <span>Rename Class</span>
              </h3>
              <button
                onClick={() => setEditingClass(null)}
                className="text-olive-400 hover:text-olive-700 p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRenameClass} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-olive-800 uppercase mb-1">
                  Class Name
                </label>
                <input
                  type="text"
                  value={renameClassName}
                  onChange={(e) => setRenameClassName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-olive-300 rounded-lg text-sm text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
                  required
                />
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingClass(null)}
                  className="px-4 py-2 border border-olive-200 rounded-lg text-sm font-semibold text-olive-700 hover:bg-olive-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !renameClassName.trim()}
                  className="px-4 py-2 bg-schoolYellow-500 hover:bg-schoolYellow-400 text-olive-950 font-bold text-sm rounded-lg shadow-sm disabled:opacity-50"
                >
                  {isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Rename Subject */}
      {editingSubject && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-olive-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-olive-900 flex items-center space-x-2">
                <Pencil className="w-4 h-4 text-schoolYellow-600" />
                <span>Rename Subject</span>
              </h3>
              <button
                onClick={() => setEditingSubject(null)}
                className="text-olive-400 hover:text-olive-700 p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRenameSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-olive-800 uppercase mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  value={renameSubjectName}
                  onChange={(e) => setRenameSubjectName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-olive-300 rounded-lg text-sm text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
                  required
                />
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSubject(null)}
                  className="px-4 py-2 border border-olive-200 rounded-lg text-sm font-semibold text-olive-700 hover:bg-olive-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !renameSubjectName.trim()}
                  className="px-4 py-2 bg-schoolYellow-500 hover:bg-schoolYellow-400 text-olive-950 font-bold text-sm rounded-lg shadow-sm disabled:opacity-50"
                >
                  {isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Class Confirmation (Super Admin Only) */}
      {deletingClass && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-red-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-olive-900">
                  Delete Class "{deletingClass.name}"?
                </h3>
                <p className="text-xs font-semibold text-red-600 mt-0.5">
                  Super Admin Privileged Action
                </p>
              </div>
            </div>

            <p className="text-sm text-olive-700 mb-6">
              Are you sure you want to delete this class? Note that if this class still has enrolled students, deletion will be safely blocked by the system.
            </p>

            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setDeletingClass(null)}
                className="px-4 py-2 border border-olive-200 rounded-lg text-sm font-semibold text-olive-700 hover:bg-olive-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteClassConfirm}
                disabled={isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-lg shadow-sm disabled:opacity-50 flex items-center space-x-1.5"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete Subject Confirmation (Super Admin Only) */}
      {deletingSubject && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-red-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-olive-900">
                  Delete Subject "{deletingSubject.name}"?
                </h3>
                <p className="text-xs font-semibold text-red-600 mt-0.5">
                  Super Admin Privileged Action
                </p>
              </div>
            </div>

            <p className="text-sm text-olive-700 mb-6 leading-relaxed">
              Are you sure you want to delete <span className="font-extrabold text-red-950 underline">{deletingSubject.name}</span> school-wide? This will permanently remove all teacher assignments and recorded student scores for this subject across all classes.
            </p>

            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setDeletingSubject(null)}
                className="px-4 py-2 border border-olive-200 rounded-lg text-sm font-semibold text-olive-700 hover:bg-olive-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSubjectConfirm}
                disabled={isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-lg shadow-sm disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>Confirm Delete Subject</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
