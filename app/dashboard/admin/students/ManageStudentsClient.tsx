'use client';

/**
 * @file app/dashboard/admin/students/ManageStudentsClient.tsx
 * @description Client component for Managing Students in the Admin Dashboard.
 * Features class-grouped student list with admission number badges and passport thumbnails,
 * Add & Edit Student workflows, Passport Photo Upload, and Guardian (Parent) Account Linking.
 */

import { useState, useTransition } from 'react';
import {
  createStudentAction,
  updateStudentAction,
  linkGuardianAction,
  unlinkGuardianAction,
  StudentRecordInput,
} from '@/app/dashboard/admin/actions';
import PassportUploadModal from '@/components/students/PassportUploadModal';
import {
  Users,
  Plus,
  Edit2,
  Upload,
  User,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  School,
  X,
  Sparkles,
  UserCheck,
  UserPlus,
  Trash2,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { ClassItem, StudentItem } from '@/lib/types/database';

export interface StudentWithSignedUrl extends StudentItem {
  signedPassportUrl?: string | null;
}

export interface ParentProfileOption {
  id: string;
  fullName: string;
  email?: string | null;
}

export interface StudentGuardianLink {
  guardianId: string;
  studentId: string;
  fullName: string;
  email?: string | null;
}

interface ManageStudentsClientProps {
  classes: ClassItem[];
  students: StudentWithSignedUrl[];
  parentProfiles: ParentProfileOption[];
  studentGuardianMap: Record<string, StudentGuardianLink[]>;
}

export default function ManageStudentsClient({
  classes,
  students,
  parentProfiles = [],
  studentGuardianMap = {},
}: ManageStudentsClientProps) {
  // Modal Visibility States
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<StudentWithSignedUrl | null>(null);
  const [passportUploadTarget, setPassportUploadTarget] = useState<StudentWithSignedUrl | null>(null);
  const [guardianModalTarget, setGuardianModalTarget] = useState<StudentWithSignedUrl | null>(null);

  // Guardian Linking Modal State
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [guardianError, setGuardianError] = useState<string | null>(null);
  const [guardianSuccess, setGuardianSuccess] = useState<string | null>(null);
  const [unlinkingGuardianId, setUnlinkingGuardianId] = useState<string | null>(null);

  // Search Filter
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Add Form State
  const [addFullName, setAddFullName] = useState<string>('');
  const [addClassId, setAddClassId] = useState<string>('');
  const [addAdmissionNumber, setAddAdmissionNumber] = useState<string>('');
  const [addDateOfBirth, setAddDateOfBirth] = useState<string>('');
  const [addGender, setAddGender] = useState<string>('');
  const [addHeightCm, setAddHeightCm] = useState<string>('');
  const [addWeightKg, setAddWeightKg] = useState<string>('');
  const [addError, setAddError] = useState<string | null>(null);

  // Edit Form State
  const [editFullName, setEditFullName] = useState<string>('');
  const [editClassId, setEditClassId] = useState<string>('');
  const [editAdmissionNumber, setEditAdmissionNumber] = useState<string>('');
  const [editDateOfBirth, setEditDateOfBirth] = useState<string>('');
  const [editGender, setEditGender] = useState<string>('');
  const [editHeightCm, setEditHeightCm] = useState<string>('');
  const [editWeightKg, setEditWeightKg] = useState<string>('');
  const [editError, setEditError] = useState<string | null>(null);

  // Global Feedback
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  // --- Filter Students by Search Term or Admission Number ---
  const filteredStudents = students.filter(
    (s) =>
      s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.admission_number &&
        s.admission_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Group filtered students by class
  const studentsByClass: Record<string, StudentWithSignedUrl[]> = {};
  classes.forEach((c) => {
    studentsByClass[c.id] = filteredStudents.filter((s) => s.class_id === c.id);
  });

  // Students with no assigned class or invalid class_id
  const unassignedStudents = filteredStudents.filter(
    (s) => !s.class_id || !classes.some((c) => c.id === s.class_id)
  );

  // --- Handlers: Add Student ---
  const handleOpenAddModal = () => {
    setAddFullName('');
    setAddClassId(classes.length > 0 ? classes[0].id : '');
    setAddAdmissionNumber('');
    setAddDateOfBirth('');
    setAddGender('');
    setAddHeightCm('');
    setAddWeightKg('');
    setAddError(null);
    setIsAddModalOpen(true);
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setSuccessMessage(null);

    if (!addFullName.trim()) {
      setAddError('Please enter the student full name.');
      return;
    }

    if (!addClassId) {
      setAddError('Please select a class for the student.');
      return;
    }

    if (!addAdmissionNumber.trim()) {
      setAddError('Please enter an admission number.');
      return;
    }

    if (addHeightCm.trim()) {
      const h = Number(addHeightCm);
      if (isNaN(h) || h < 30 || h > 250) {
        setAddError('Height must be between 30 cm and 250 cm.');
        return;
      }
    }

    if (addWeightKg.trim()) {
      const w = Number(addWeightKg);
      if (isNaN(w) || w < 1 || w > 200) {
        setAddError('Weight must be between 1 kg and 200 kg.');
        return;
      }
    }

    const payload: StudentRecordInput = {
      fullName: addFullName.trim(),
      classId: addClassId,
      admissionNumber: addAdmissionNumber.trim(),
      dateOfBirth: addDateOfBirth || null,
      gender: addGender || null,
      heightCm: addHeightCm.trim() ? Number(addHeightCm) : null,
      weightKg: addWeightKg.trim() ? Number(addWeightKg) : null,
    };

    startTransition(async () => {
      const res = await createStudentAction(payload);
      if (res.error) {
        setAddError(res.error);
      } else {
        setSuccessMessage(`Created student "${payload.fullName}" successfully.`);
        setIsAddModalOpen(false);
      }
    });
  };

  // --- Handlers: Edit Student ---
  const handleOpenEditModal = (student: StudentWithSignedUrl) => {
    setEditingStudent(student);
    setEditFullName(student.full_name);
    setEditClassId(student.class_id || '');
    setEditAdmissionNumber(student.admission_number || '');
    setEditDateOfBirth(student.date_of_birth || '');
    setEditGender(student.gender || '');
    setEditHeightCm(student.height_cm ? String(student.height_cm) : '');
    setEditWeightKg(student.weight_kg ? String(student.weight_kg) : '');
    setEditError(null);
  };

  const handleUpdateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setEditError(null);
    setSuccessMessage(null);

    if (!editFullName.trim()) {
      setEditError('Student full name cannot be empty.');
      return;
    }

    if (!editClassId) {
      setEditError('Please select a class.');
      return;
    }

    if (!editAdmissionNumber.trim()) {
      setEditError('Please enter an admission number.');
      return;
    }

    if (editHeightCm.trim()) {
      const h = Number(editHeightCm);
      if (isNaN(h) || h < 30 || h > 250) {
        setEditError('Height must be between 30 cm and 250 cm.');
        return;
      }
    }

    if (editWeightKg.trim()) {
      const w = Number(editWeightKg);
      if (isNaN(w) || w < 1 || w > 200) {
        setEditError('Weight must be between 1 kg and 200 kg.');
        return;
      }
    }

    const payload: StudentRecordInput = {
      fullName: editFullName.trim(),
      classId: editClassId,
      admissionNumber: editAdmissionNumber.trim(),
      dateOfBirth: editDateOfBirth || null,
      gender: editGender || null,
      heightCm: editHeightCm.trim() ? Number(editHeightCm) : null,
      weightKg: editWeightKg.trim() ? Number(editWeightKg) : null,
    };

    startTransition(async () => {
      const res = await updateStudentAction(editingStudent.id, payload);
      if (res.error) {
        setEditError(res.error);
      } else {
        setSuccessMessage(`Updated student "${payload.fullName}" successfully.`);
        setEditingStudent(null);
      }
    });
  };

  // --- Handlers: Guardian Linking Modal ---
  const handleOpenGuardianModal = (student: StudentWithSignedUrl) => {
    setGuardianModalTarget(student);
    setGuardianError(null);
    setGuardianSuccess(null);
    setUnlinkingGuardianId(null);

    const currentLinks = studentGuardianMap[student.id] || [];
    const linkedIds = new Set(currentLinks.map((l) => l.guardianId));
    const unlinkedParents = parentProfiles.filter((p) => !linkedIds.has(p.id));

    setSelectedParentId(unlinkedParents.length > 0 ? unlinkedParents[0].id : '');
  };

  const handleLinkGuardian = () => {
    if (!guardianModalTarget || !selectedParentId) return;

    setGuardianError(null);
    setGuardianSuccess(null);

    startTransition(async () => {
      const res = await linkGuardianAction(guardianModalTarget.id, selectedParentId);

      if (res.error) {
        setGuardianError(res.error);
      } else {
        setGuardianSuccess('Linked parent account successfully.');
        const currentLinks = studentGuardianMap[guardianModalTarget.id] || [];
        const linkedIds = new Set([
          ...currentLinks.map((l) => l.guardianId),
          selectedParentId,
        ]);
        const unlinkedParents = parentProfiles.filter((p) => !linkedIds.has(p.id));
        setSelectedParentId(unlinkedParents.length > 0 ? unlinkedParents[0].id : '');
      }
    });
  };

  const handleUnlinkGuardian = (guardianId: string) => {
    if (!guardianModalTarget) return;

    setGuardianError(null);
    setGuardianSuccess(null);

    startTransition(async () => {
      const res = await unlinkGuardianAction(guardianModalTarget.id, guardianId);

      if (res.error) {
        setGuardianError(res.error);
      } else {
        setGuardianSuccess('Unlinked guardian successfully.');
        setUnlinkingGuardianId(null);
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
              Manage Students
            </h1>
          </div>
          <p className="text-olive-700 text-sm font-medium">
            Manage student records, passport photos, and link parent accounts to student profiles.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          disabled={classes.length === 0}
          className="px-5 py-3 bg-schoolYellow-500 hover:bg-schoolYellow-400 text-olive-950 font-bold text-sm rounded-xl shadow-sm flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Student</span>
        </button>
      </div>

      {/* Global Success / Alert Banner */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-900 text-sm font-semibold">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-olive-200 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-olive-400" />
          <input
            type="text"
            placeholder="Search student by name or admission number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-olive-200 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
          />
        </div>

        {/* Classes List with Enrolled Student Cards */}
        {classes.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-olive-200 rounded-xl">
            <School className="w-12 h-12 text-olive-400 mx-auto mb-3" />
            <p className="text-olive-700 font-semibold text-base">
              No classes configured yet.
            </p>
            <p className="text-olive-500 text-sm mt-1">
              Create your school classes in Manage Classes & Subjects first before adding students.
            </p>
          </div>
        ) : (
          classes.map((cls) => {
            const classStudents = studentsByClass[cls.id] || [];

            return (
              <div
                key={cls.id}
                className="bg-white rounded-2xl border border-olive-200 overflow-hidden shadow-2xs"
              >
                {/* Class Header Bar */}
                <div className="p-4 bg-olive-50 border-b border-olive-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-olive-100 flex items-center justify-center text-olive-800 shrink-0">
                      <GraduationCap className="w-4.5 h-4.5" />
                    </div>
                    <h2 className="font-extrabold text-olive-950 text-base">
                      {cls.name}
                    </h2>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 bg-olive-100 text-olive-900 border border-olive-200 rounded-full">
                    {classStudents.length} {classStudents.length === 1 ? 'Student' : 'Students'}
                  </span>
                </div>

                {/* Class Student Cards Grid */}
                {classStudents.length === 0 ? (
                  <div className="p-6 text-center text-xs text-olive-500 font-medium italic">
                    No students currently enrolled in {cls.name}.
                  </div>
                ) : (
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classStudents.map((student) => {
                      const linkedGuardians = studentGuardianMap[student.id] || [];

                      return (
                        <div
                          key={student.id}
                          className="p-4 rounded-xl border border-olive-200 bg-white hover:border-olive-300 shadow-2xs transition-all flex flex-col justify-between space-y-3"
                        >
                          <div className="flex items-center space-x-3.5 min-w-0">
                            {/* Passport Thumbnail */}
                            {student.signedPassportUrl ? (
                              <img
                                src={student.signedPassportUrl}
                                alt={student.full_name}
                                className="w-12 h-12 rounded-xl object-cover border border-olive-200 shadow-2xs shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-olive-100 border border-olive-200 flex items-center justify-center text-olive-600 shrink-0">
                                <User className="w-6 h-6 stroke-[2]" />
                              </div>
                            )}

                            <div className="min-w-0 space-y-0.5">
                              <h3 className="font-bold text-sm text-olive-950 truncate">
                                {student.full_name}
                              </h3>
                              {student.admission_number && (
                                <p className="text-xs font-semibold text-olive-700 font-mono">
                                  Adm #: <span className="text-olive-950 font-bold">{student.admission_number}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Student Actions Bar */}
                          <div className="pt-3 border-t border-olive-100 flex items-center justify-between gap-2">
                            {/* Manage Guardians Button */}
                            <button
                              onClick={() => handleOpenGuardianModal(student)}
                              className="px-2.5 py-1.5 bg-olive-50 hover:bg-olive-100 text-olive-800 rounded-lg border border-olive-200 transition-colors cursor-pointer flex items-center space-x-1.5 text-xs font-bold shrink-0"
                              title="Manage Linked Guardians (Parents)"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-schoolYellow-600" />
                              <span>Guardians ({linkedGuardians.length})</span>
                            </button>

                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => setPassportUploadTarget(student)}
                                className="p-1.5 text-olive-700 hover:text-olive-950 hover:bg-olive-100 rounded-lg transition-colors cursor-pointer"
                                title="Upload / Change Passport Photo"
                              >
                                <Upload className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleOpenEditModal(student)}
                                className="p-1.5 text-olive-700 hover:text-olive-950 hover:bg-olive-100 rounded-lg transition-colors cursor-pointer"
                                title="Edit Student Details"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ================= MODAL 1: ADD STUDENT MODAL ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-olive-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-olive-100 pb-3">
              <h3 className="text-lg font-bold text-olive-950 flex items-center space-x-2">
                <Plus className="w-5 h-5 text-schoolYellow-600" />
                <span>Add New Student</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-olive-400 hover:text-olive-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Onyinyechukwu Mary Nwodo"
                  value={addFullName}
                  onChange={(e) => setAddFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                    Class *
                  </label>
                  <select
                    value={addClassId}
                    onChange={(e) => setAddClassId(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500 bg-white"
                    required
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                    Admission Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ADM/2026/042"
                    value={addAdmissionNumber}
                    onChange={(e) => setAddAdmissionNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold font-mono text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={addDateOfBirth}
                    onChange={(e) => setAddDateOfBirth(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                    Gender
                  </label>
                  <select
                    value={addGender}
                    onChange={(e) => setAddGender(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500 bg-white"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="250"
                    placeholder="30 - 250"
                    value={addHeightCm}
                    onChange={(e) => setAddHeightCm(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    placeholder="1 - 200"
                    value={addWeightKg}
                    onChange={(e) => setAddWeightKg(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
                  />
                </div>
              </div>

              {addError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2 border border-olive-300 rounded-xl text-xs font-bold text-olive-800 hover:bg-olive-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !addFullName.trim() || !addClassId}
                  className="px-5 py-2 bg-schoolYellow-500 hover:bg-schoolYellow-400 text-olive-950 font-bold text-xs rounded-xl shadow-sm flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>Create Student</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: EDIT STUDENT MODAL ================= */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-olive-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-olive-100 pb-3">
              <h3 className="text-lg font-bold text-olive-950 flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-schoolYellow-600" />
                <span>Edit Student Record</span>
              </h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-olive-400 hover:text-olive-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                    Class *
                  </label>
                  <select
                    value={editClassId}
                    onChange={(e) => setEditClassId(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500 bg-white"
                    required
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                    Admission Number *
                  </label>
                  <input
                    type="text"
                    value={editAdmissionNumber}
                    onChange={(e) => setEditAdmissionNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold font-mono text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={editDateOfBirth}
                    onChange={(e) => setEditDateOfBirth(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                    Gender
                  </label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500 bg-white"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="250"
                    placeholder="30 - 250"
                    value={editHeightCm}
                    onChange={(e) => setEditHeightCm(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    placeholder="1 - 200"
                    value={editWeightKg}
                    onChange={(e) => setEditWeightKg(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
                  />
                </div>
              </div>

              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  disabled={isPending}
                  className="px-4 py-2 border border-olive-300 rounded-xl text-xs font-bold text-olive-800 hover:bg-olive-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !editFullName.trim() || !editClassId}
                  className="px-5 py-2 bg-schoolYellow-500 hover:bg-schoolYellow-400 text-olive-950 font-bold text-xs rounded-xl shadow-sm flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: PASSPORT UPLOAD MODAL ================= */}
      {passportUploadTarget && (
        <PassportUploadModal
          studentId={passportUploadTarget.id}
          studentName={passportUploadTarget.full_name}
          currentPassportUrl={passportUploadTarget.signedPassportUrl}
          isOpen={!!passportUploadTarget}
          onClose={() => setPassportUploadTarget(null)}
          onSuccess={() => {
            setSuccessMessage(
              `Updated passport photo for ${passportUploadTarget.full_name}.`
            );
            setPassportUploadTarget(null);
          }}
        />
      )}

      {/* ================= MODAL 4: MANAGE GUARDIANS MODAL ================= */}
      {guardianModalTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-olive-200 animate-in fade-in zoom-in-95 duration-150 space-y-5">
            <div className="flex items-center justify-between border-b border-olive-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-olive-950 flex items-center space-x-2">
                  <UserCheck className="w-5 h-5 text-schoolYellow-600" />
                  <span>Manage Linked Guardians</span>
                </h3>
                <p className="text-xs font-semibold text-olive-600 mt-0.5">
                  Student: <span className="text-olive-950 font-bold">{guardianModalTarget.full_name}</span>
                </p>
              </div>
              <button
                onClick={() => setGuardianModalTarget(null)}
                className="text-olive-400 hover:text-olive-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error / Success Alerts */}
            {guardianError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4.5 h-4.5 text-red-600 shrink-0" />
                <span>{guardianError}</span>
              </div>
            )}

            {guardianSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                <span>{guardianSuccess}</span>
              </div>
            )}

            {/* Section 1: Currently Linked Guardians */}
            <div className="space-y-2">
              <label className="block text-3xs font-extrabold uppercase text-olive-600 tracking-wider">
                Currently Linked Parent Accounts:
              </label>

              {!(studentGuardianMap[guardianModalTarget.id] && studentGuardianMap[guardianModalTarget.id].length > 0) ? (
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium leading-relaxed">
                  No guardian linked yet — this student's report won't be visible to any parent account until one is added.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {studentGuardianMap[guardianModalTarget.id].map((link) => (
                    <div
                      key={link.guardianId}
                      className="p-3 bg-olive-50/80 border border-olive-200 rounded-xl flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="font-bold text-xs text-olive-950 truncate flex items-center space-x-1.5">
                          <User className="w-3.5 h-3.5 text-olive-600 shrink-0" />
                          <span className="truncate">{link.fullName}</span>
                        </div>
                        {link.email && (
                          <div className="text-3xs font-medium text-olive-600 truncate flex items-center space-x-1">
                            <Mail className="w-3 h-3 text-olive-400 shrink-0" />
                            <span className="truncate">{link.email}</span>
                          </div>
                        )}
                      </div>

                      {/* Unlink Action */}
                      {unlinkingGuardianId === link.guardianId ? (
                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleUnlinkGuardian(link.guardianId)}
                            disabled={isPending}
                            className="px-2 py-1 bg-red-600 text-white rounded-md text-3xs font-bold cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setUnlinkingGuardianId(null)}
                            disabled={isPending}
                            className="px-2 py-1 bg-olive-200 text-olive-800 rounded-md text-3xs font-bold cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setUnlinkingGuardianId(link.guardianId)}
                          disabled={isPending}
                          className="p-1.5 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                          title="Unlink Guardian"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: Link a New Guardian */}
            <div className="space-y-3 pt-3 border-t border-olive-100">
              <label className="block text-3xs font-extrabold uppercase text-olive-600 tracking-wider">
                Link New Parent Account:
              </label>

              {parentProfiles.length === 0 ? (
                <div className="p-3 bg-olive-50 rounded-xl text-xs text-olive-600 font-medium italic">
                  No parent accounts found in your school. Create a user account with role 'parent' in Manage Users first.
                </div>
              ) : (
                <div className="space-y-3">
                  <select
                    value={selectedParentId}
                    onChange={(e) => setSelectedParentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-olive-300 rounded-xl text-xs font-bold text-olive-950 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500 bg-white"
                  >
                    {parentProfiles.map((parent) => (
                      <option key={parent.id} value={parent.id}>
                        {parent.fullName} {parent.email ? `(${parent.email})` : ''}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleLinkGuardian}
                    disabled={isPending || !selectedParentId}
                    className="w-full py-2.5 bg-schoolYellow-500 hover:bg-schoolYellow-400 text-olive-950 font-bold text-xs rounded-xl shadow-sm flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    <span>Link Parent Account</span>
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setGuardianModalTarget(null)}
                className="px-4 py-2 border border-olive-300 rounded-xl text-xs font-bold text-olive-800 hover:bg-olive-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
