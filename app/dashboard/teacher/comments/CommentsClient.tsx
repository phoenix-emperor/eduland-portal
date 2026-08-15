'use client';

/**
 * @file app/dashboard/teacher/comments/CommentsClient.tsx
 * @description Client Component for Teacher General Comment Entry screen (CLASS-TEACHER-ONLY).
 * Allows designated class teachers to write multi-line general comments per student for report cards.
 * Excludes class_teacher_signature_url entirely to preserve signature data.
 */

import { useState, useEffect, useTransition, useMemo } from 'react';
import {
  bulkSaveGeneralCommentsAction,
  getCommentsStudentsAndRecordsAction,
  CommentInputItem,
} from '@/app/dashboard/teacher/actions';
import {
  UserCheck,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  Search,
  MessageSquare,
  Info,
} from 'lucide-react';

export interface ClassTeacherClassItem {
  id: string;
  name: string;
}

export interface TermItemOption {
  id: string;
  name: string;
  session: string;
  created_at: string;
}

interface CommentsClientProps {
  classes: ClassTeacherClassItem[];
  terms: TermItemOption[];
}

interface LocalStudentComment {
  studentId: string;
  fullName: string;
  admissionNumber: string | null;
  comment: string;
  isInitialSaved: boolean;
}

export default function CommentsClient({ classes, terms }: CommentsClientProps) {
  // Selected Class & Term State
  const [selectedClassId, setSelectedClassId] = useState<string>(
    classes.length > 0 ? classes[0].id : ''
  );
  const [selectedTermId, setSelectedTermId] = useState<string>(
    terms.length > 0 ? terms[0].id : ''
  );

  // Student list & comments local state
  const [studentsComments, setStudentsComments] = useState<LocalStudentComment[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [isPending, startTransition] = useTransition();

  // Find active class name
  const activeClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId),
    [classes, selectedClassId]
  );

  // Load students & existing comment records whenever Class or Term changes
  useEffect(() => {
    if (!selectedClassId || !selectedTermId) {
      setStudentsComments([]);
      return;
    }

    let isMounted = true;
    setLoadingData(true);
    setSaveSuccess(null);
    setSaveError(null);

    getCommentsStudentsAndRecordsAction({
      classId: selectedClassId,
      termId: selectedTermId,
    }).then((res) => {
      if (!isMounted) return;
      setLoadingData(false);

      if (res.students) {
        const localList: LocalStudentComment[] = res.students.map((st) => {
          const existing = res.commentsMap?.[st.id];
          return {
            studentId: st.id,
            fullName: st.full_name,
            admissionNumber: st.admission_number,
            comment: existing ? existing.comment : '',
            isInitialSaved: Boolean(existing?.comment),
          };
        });
        setStudentsComments(localList);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedClassId, selectedTermId]);

  // Handle Comment change
  const handleCommentChange = (studentId: string, val: string) => {
    setSaveSuccess(null);
    setSaveError(null);

    setStudentsComments((prev) =>
      prev.map((item) => {
        if (item.studentId === studentId) {
          return { ...item, comment: val };
        }
        return item;
      })
    );
  };

  // Filtered students for search
  const filteredStudents = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return studentsComments.filter(
      (s) =>
        s.fullName.toLowerCase().includes(term) ||
        (s.admissionNumber && s.admissionNumber.toLowerCase().includes(term))
    );
  }, [studentsComments, searchTerm]);

  // Save All Comments Handler
  const handleSaveAll = () => {
    setSaveSuccess(null);
    setSaveError(null);

    if (!selectedClassId || !selectedTermId) {
      setSaveError('Please select both a Designated Class and a Term.');
      return;
    }

    const payload: CommentInputItem[] = studentsComments.map((item) => ({
      studentId: item.studentId,
      comment: item.comment,
    }));

    startTransition(async () => {
      const res = await bulkSaveGeneralCommentsAction({
        classId: selectedClassId,
        termId: selectedTermId,
        comments: payload,
      });

      if (res.error) {
        setSaveError(res.error);
      } else {
        setSaveSuccess(`Successfully saved general comments for ${res.count || payload.length} students!`);
        setStudentsComments((prev) =>
          prev.map((item) => ({
            ...item,
            isInitialSaved: item.comment.trim().length > 0,
          }))
        );
      }
    });
  };

  // ZERO-CLASSES EMPTY STATE (Not a designated class teacher)
  if (classes.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl p-8 border border-olive-200 shadow-sm text-center">
          <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-300">
            <UserCheck className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-olive-950 mb-2">
            Class Teacher Access Only
          </h2>
          <p className="text-olive-700 text-sm font-medium max-w-md mx-auto mb-6 leading-relaxed">
            You are not currently designated as a class teacher for any class.
          </p>
          <div className="p-4 bg-olive-50 border border-olive-200 rounded-xl text-xs font-semibold text-olive-800 max-w-lg mx-auto flex items-center justify-center space-x-2">
            <Info className="w-4 h-4 text-olive-600 shrink-0" />
            <span>General comments writing is restricted to designated class teachers. Contact your school administrator to assign you as a Class Teacher.</span>
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
              General Report Comments
            </h1>
          </div>
          <p className="text-olive-700 text-sm font-medium">
            Class Teacher Portal — Write end-of-term general comments for students on their report cards.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-olive-50 border border-olive-200 px-3.5 py-2 rounded-xl text-xs font-bold text-olive-800 shrink-0">
          <MessageSquare className="w-4 h-4 text-schoolYellow-600" />
          <span>Class Teacher Report Comments</span>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="bg-white rounded-2xl p-5 border border-olive-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Designated Class Selector */}
        <div>
          <label className="block text-xs font-bold uppercase text-olive-900 mb-1.5 flex items-center space-x-1.5">
            <UserCheck className="w-4 h-4 text-olive-600" />
            <span>Designated Class <span className="text-red-500">*</span></span>
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-olive-300 rounded-xl text-sm font-bold text-olive-950 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
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

      {/* Comments List Container */}
      <div className="bg-white rounded-2xl border border-olive-200 shadow-sm overflow-hidden">
        {/* Controls Header */}
        <div className="p-5 bg-olive-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-schoolYellow-500 text-olive-950 font-bold flex items-center justify-center">
              <Users className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-extrabold text-base tracking-tight">
                {activeClass ? `${activeClass.name} — General Comments` : 'Comments List'}
              </h2>
              <p className="text-2xs text-olive-300 font-medium">
                {studentsComments.length} enrolled {studentsComments.length === 1 ? 'student' : 'students'}
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
              disabled={isPending || loadingData || studentsComments.length === 0}
              className="px-5 py-2 bg-schoolYellow-500 hover:bg-schoolYellow-400 text-olive-950 font-extrabold text-xs rounded-xl shadow-sm flex items-center space-x-2 shrink-0 disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save All Comments</span>
            </button>
          </div>
        </div>

        {/* Data Loading Spinner */}
        {loadingData ? (
          <div className="p-12 text-center text-olive-600 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-schoolYellow-600" />
            <p className="text-xs font-bold uppercase tracking-wider">Loading Class Comments...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-olive-500 text-xs font-medium italic">
            {studentsComments.length === 0
              ? 'No students currently enrolled in this class.'
              : 'No matching students found for search filter.'}
          </div>
        ) : (
          <div className="divide-y divide-olive-100">
            {filteredStudents.map((st, idx) => {
              const charCount = st.comment.trim().length;
              const hasContent = charCount > 0;

              return (
                <div key={st.studentId} className="p-5 sm:p-6 hover:bg-olive-50/40 transition-colors space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-olive-800 text-schoolYellow-400 font-bold text-xs flex items-center justify-center border border-olive-900 shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <h3 className="font-bold text-olive-950 text-sm">
                          {st.fullName}
                        </h3>
                        {st.admissionNumber && (
                          <div className="text-2xs text-olive-500 font-mono">
                            Adm: {st.admissionNumber}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-2xs font-mono text-olive-500">
                        {charCount} chars
                      </span>
                      {hasContent ? (
                        st.isInitialSaved ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-2xs font-bold">
                            Saved
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded text-2xs font-bold">
                            Draft
                          </span>
                        )
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-2xs font-medium italic">
                          No comment
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Multi-line Comment Textarea */}
                  <div>
                    <textarea
                      rows={3}
                      placeholder={`Write end-of-term general comment for ${st.fullName}... (e.g. An attentive and hardworking student who demonstrates great leadership in class activities.)`}
                      value={st.comment}
                      onChange={(e) => handleCommentChange(st.studentId, e.target.value)}
                      className="w-full p-3.5 bg-white border border-olive-300 rounded-xl text-sm font-medium text-olive-950 placeholder-olive-400 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500 leading-relaxed"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 bg-olive-50 border-t border-olive-200 flex items-center justify-between">
          <div className="text-2xs font-medium text-olive-700">
            Designated Class Teacher General Comments &bull; Eduland Portal
          </div>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isPending || loadingData || studentsComments.length === 0}
            className="px-6 py-2.5 bg-schoolYellow-500 hover:bg-schoolYellow-400 text-olive-950 font-extrabold text-xs rounded-xl shadow-sm flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save All Comments</span>
          </button>
        </div>
      </div>
    </div>
  );
}
