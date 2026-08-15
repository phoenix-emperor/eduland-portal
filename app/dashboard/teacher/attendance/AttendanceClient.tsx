'use client';

/**
 * @file app/dashboard/teacher/attendance/AttendanceClient.tsx
 * @description Client Component for Teacher Attendance Entry screen (CLASS-TEACHER-ONLY).
 * Allows designated class teachers to set total school days opened for the term,
 * record days present per student, validate that days present does not exceed days opened, and bulk save.
 */

import { useState, useEffect, useTransition, useMemo } from 'react';
import {
  bulkSaveAttendanceAction,
  getAttendanceStudentsAndRecordsAction,
  AttendanceInputItem,
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
  Info,
  Clock,
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

interface AttendanceClientProps {
  classes: ClassTeacherClassItem[];
  terms: TermItemOption[];
}

interface LocalStudentAttendance {
  studentId: string;
  fullName: string;
  admissionNumber: string | null;
  daysPresent: string; // Keep as string for seamless typing
  isInitialSaved: boolean;
}

export default function AttendanceClient({ classes, terms }: AttendanceClientProps) {
  // Selected Class & Term State
  const [selectedClassId, setSelectedClassId] = useState<string>(
    classes.length > 0 ? classes[0].id : ''
  );
  const [selectedTermId, setSelectedTermId] = useState<string>(
    terms.length > 0 ? terms[0].id : ''
  );

  // Class-wide Days Opened state
  const [daysOpenedInput, setDaysOpenedInput] = useState<string>('90');

  // Student list & attendance records local state
  const [studentsAttendance, setStudentsAttendance] = useState<LocalStudentAttendance[]>([]);
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

  // Load students & existing attendance records whenever Class or Term changes
  useEffect(() => {
    if (!selectedClassId || !selectedTermId) {
      setStudentsAttendance([]);
      return;
    }

    let isMounted = true;
    setLoadingData(true);
    setSaveSuccess(null);
    setSaveError(null);

    getAttendanceStudentsAndRecordsAction({
      classId: selectedClassId,
      termId: selectedTermId,
    }).then((res) => {
      if (!isMounted) return;
      setLoadingData(false);

      if (res.existingDaysOpened > 0) {
        setDaysOpenedInput(String(res.existingDaysOpened));
      }

      if (res.students) {
        const localList: LocalStudentAttendance[] = res.students.map((st) => {
          const existing = res.attendanceMap?.[st.id];
          return {
            studentId: st.id,
            fullName: st.full_name,
            admissionNumber: st.admission_number,
            daysPresent: existing ? String(existing.daysPresent) : '0',
            isInitialSaved: Boolean(existing),
          };
        });
        setStudentsAttendance(localList);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedClassId, selectedTermId]);

  // Handle Days Present change
  const handleDaysPresentChange = (studentId: string, val: string) => {
    setSaveSuccess(null);
    setSaveError(null);

    setStudentsAttendance((prev) =>
      prev.map((item) => {
        if (item.studentId === studentId) {
          return { ...item, daysPresent: val };
        }
        return item;
      })
    );
  };

  // Filtered students for search
  const filteredStudents = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return studentsAttendance.filter(
      (s) =>
        s.fullName.toLowerCase().includes(term) ||
        (s.admissionNumber && s.admissionNumber.toLowerCase().includes(term))
    );
  }, [studentsAttendance, searchTerm]);

  // Client-side Validation (daysPresent <= daysOpened)
  const validateAttendance = (): {
    valid: boolean;
    daysOpenedNum: number;
    payload: AttendanceInputItem[];
    error?: string;
  } => {
    const daysOpenedNum = Number(daysOpenedInput);

    if (isNaN(daysOpenedNum) || daysOpenedNum < 0) {
      return {
        valid: false,
        daysOpenedNum: 0,
        payload: [],
        error: 'Please enter a valid non-negative number for Days School Opened.',
      };
    }

    const payload: AttendanceInputItem[] = [];

    for (const item of studentsAttendance) {
      const presentNum = Number(item.daysPresent);

      if (isNaN(presentNum) || presentNum < 0) {
        return {
          valid: false,
          daysOpenedNum,
          payload: [],
          error: `Invalid Days Present value for ${item.fullName}. Must be a non-negative number.`,
        };
      }

      if (presentNum > daysOpenedNum) {
        return {
          valid: false,
          daysOpenedNum,
          payload: [],
          error: `Days Present (${presentNum}) for ${item.fullName} cannot exceed Days School Opened (${daysOpenedNum}).`,
        };
      }

      payload.push({
        studentId: item.studentId,
        daysPresent: presentNum,
      });
    }

    return { valid: true, daysOpenedNum, payload };
  };

  // Save All Attendance Records Handler
  const handleSaveAll = () => {
    setSaveSuccess(null);
    setSaveError(null);

    if (!selectedClassId || !selectedTermId) {
      setSaveError('Please select both a Designated Class and a Term.');
      return;
    }

    const { valid, daysOpenedNum, payload, error: valErr } = validateAttendance();
    if (!valid) {
      setSaveError(valErr || 'Invalid attendance values entered.');
      return;
    }

    startTransition(async () => {
      const res = await bulkSaveAttendanceAction({
        classId: selectedClassId,
        termId: selectedTermId,
        daysOpened: daysOpenedNum,
        attendanceRecords: payload,
      });

      if (res.error) {
        setSaveError(res.error);
      } else {
        setSaveSuccess(`Successfully saved attendance records for ${res.count || payload.length} students!`);
        setStudentsAttendance((prev) =>
          prev.map((item) => ({ ...item, isInitialSaved: true }))
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
            <span>Attendance recording is restricted to designated class teachers. Contact your school administrator to assign you as a Class Teacher.</span>
          </div>
        </div>
      </div>
    );
  }

  const daysOpenedNum = Number(daysOpenedInput) || 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-olive-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-3 h-8 bg-schoolYellow-500 rounded-full" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-olive-900 tracking-tight">
              Class Attendance Entry
            </h1>
          </div>
          <p className="text-olive-700 text-sm font-medium">
            Class Teacher Portal — Record total school days opened and student attendance for your designated class.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-olive-50 border border-olive-200 px-3.5 py-2 rounded-xl text-xs font-bold text-olive-800 shrink-0">
          <UserCheck className="w-4 h-4 text-schoolYellow-600" />
          <span>Designated Class Teacher</span>
        </div>
      </div>

      {/* Selectors & Class-Wide Days Opened Bar */}
      <div className="bg-white rounded-2xl p-5 border border-olive-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          {/* Class-Wide Days School Opened This Term Input */}
          <div>
            <label className="block text-xs font-bold uppercase text-olive-900 mb-1.5 flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-olive-600" />
              <span>Days School Opened This Term <span className="text-red-500">*</span></span>
            </label>
            <input
              type="number"
              min={0}
              placeholder="e.g. 90"
              value={daysOpenedInput}
              onChange={(e) => {
                setSaveSuccess(null);
                setSaveError(null);
                setDaysOpenedInput(e.target.value);
              }}
              className="w-full px-3.5 py-2.5 bg-white border border-olive-300 rounded-xl text-sm font-extrabold font-mono text-olive-950 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
            />
          </div>
        </div>

        <div className="p-3 bg-schoolYellow-50 border border-schoolYellow-200 rounded-xl text-2xs text-olive-900 font-semibold flex items-center space-x-2">
          <Info className="w-4 h-4 text-schoolYellow-700 shrink-0" />
          <span>Note: "Days School Opened" applies to all students in this class for the selected term.</span>
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

      {/* Attendance Table Container */}
      <div className="bg-white rounded-2xl border border-olive-200 shadow-sm overflow-hidden">
        {/* Table Controls Header */}
        <div className="p-5 bg-olive-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-schoolYellow-500 text-olive-950 font-bold flex items-center justify-center">
              <Users className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-extrabold text-base tracking-tight">
                {activeClass ? `${activeClass.name} — Student Attendance` : 'Attendance Table'}
              </h2>
              <p className="text-2xs text-olive-300 font-medium">
                {studentsAttendance.length} enrolled {studentsAttendance.length === 1 ? 'student' : 'students'}
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
              disabled={isPending || loadingData || studentsAttendance.length === 0}
              className="px-5 py-2 bg-schoolYellow-500 hover:bg-schoolYellow-400 text-olive-950 font-extrabold text-xs rounded-xl shadow-sm flex items-center space-x-2 shrink-0 disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save Attendance</span>
            </button>
          </div>
        </div>

        {/* Data Loading Spinner */}
        {loadingData ? (
          <div className="p-12 text-center text-olive-600 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-schoolYellow-600" />
            <p className="text-xs font-bold uppercase tracking-wider">Loading Class Attendance...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-olive-500 text-xs font-medium italic">
            {studentsAttendance.length === 0
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
                  <th className="py-3 px-4 w-40 text-center">Days Present</th>
                  <th className="py-3 px-4 w-36 text-center">Days Opened</th>
                  <th className="py-3 px-4 w-36 text-center">Attendance Rate</th>
                  <th className="py-3 px-4 w-28 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-olive-100 text-xs">
                {filteredStudents.map((st, idx) => {
                  const presentNum = Number(st.daysPresent);
                  const isPresentInvalid = isNaN(presentNum) || presentNum < 0 || (daysOpenedNum >= 0 && presentNum > daysOpenedNum);

                  const percentage = daysOpenedNum > 0 && !isNaN(presentNum) && presentNum >= 0 && presentNum <= daysOpenedNum
                    ? Math.round((presentNum / daysOpenedNum) * 100)
                    : null;

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

                      {/* Days Present Input */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min={0}
                          max={daysOpenedNum}
                          value={st.daysPresent}
                          onChange={(e) => handleDaysPresentChange(st.studentId, e.target.value)}
                          className={`w-24 px-2.5 py-1.5 text-center font-mono font-bold text-sm border rounded-xl focus:outline-none focus:ring-2 ${
                            isPresentInvalid
                              ? 'border-red-500 bg-red-50 text-red-900 focus:ring-red-500'
                              : 'border-olive-300 text-olive-950 focus:ring-schoolYellow-500 bg-white'
                          }`}
                        />
                        {isPresentInvalid && (
                          <div className="text-3xs font-extrabold text-red-600 mt-1">
                            {presentNum > daysOpenedNum ? 'Exceeds Opened' : 'Invalid'}
                          </div>
                        )}
                      </td>

                      {/* Days Opened (Read-only matching class value) */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-olive-800">
                        {daysOpenedInput}
                      </td>

                      {/* Attendance % (Live Computed) */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-xl text-xs font-mono font-extrabold border ${
                          percentage === null || isPresentInvalid
                            ? 'bg-red-100 text-red-900 border-red-300'
                            : percentage >= 80
                            ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                            : percentage >= 60
                            ? 'bg-amber-100 text-amber-950 border-amber-300'
                            : 'bg-red-100 text-red-950 border-red-300'
                        }`}>
                          {percentage !== null ? `${percentage}%` : 'ERR'}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4 text-center">
                        {isPresentInvalid ? (
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
            Designated Class Teacher Attendance Entry &bull; Eduland Portal
          </div>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isPending || loadingData || studentsAttendance.length === 0}
            className="px-6 py-2.5 bg-schoolYellow-500 hover:bg-schoolYellow-400 text-olive-950 font-extrabold text-xs rounded-xl shadow-sm flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Attendance Records</span>
          </button>
        </div>
      </div>
    </div>
  );
}
