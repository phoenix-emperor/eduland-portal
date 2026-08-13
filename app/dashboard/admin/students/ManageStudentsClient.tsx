'use client';

/**
 * @file app/dashboard/admin/students/ManageStudentsClient.tsx
 * @description Client component for Managing Students in the Admin Dashboard.
 * Features class-grouped student list with admission number badges and passport thumbnails,
 * Add Student workflow with core record fields (DOB, gender, admission number, height, weight),
 * and Edit Student workflow.
 */

import { useState, useTransition } from 'react';
import {
  createStudentAction,
  updateStudentAction,
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
} from 'lucide-react';
import { ClassItem, StudentItem } from '@/lib/types/database';

export interface StudentWithSignedUrl extends StudentItem {
  signedPassportUrl?: string | null;
}

interface ManageStudentsClientProps {
  classes: ClassItem[];
  students: StudentWithSignedUrl[];
}

export default function ManageStudentsClient({
  classes,
  students,
}: ManageStudentsClientProps) {
  // Modal Visibility States
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<StudentWithSignedUrl | null>(null);
  const [passportUploadTarget, setPassportUploadTarget] = useState<StudentWithSignedUrl | null>(null);

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

    // Client-side Sanity Checks for Height & Weight
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
      dateOfBirth: addDateOfBirth.trim() || null,
      gender: addGender.trim() || null,
      heightCm: addHeightCm.trim() ? Number(addHeightCm) : null,
      weightKg: addWeightKg.trim() ? Number(addWeightKg) : null,
    };

    startTransition(async () => {
      const res = await createStudentAction(payload);
      if (res.error) {
        setAddError(res.error);
      } else {
        const createdStudentId = res.studentId;
        const clsName = classes.find((c) => c.id === addClassId)?.name;
        setSuccessMessage(`Successfully added student ${addFullName} to ${clsName || 'Class'}.`);
        setIsAddModalOpen(false);

        if (createdStudentId) {
          const newlyCreatedStudent: StudentWithSignedUrl = {
            id: createdStudentId,
            full_name: addFullName,
            class_id: addClassId,
            school_id: '',
            admission_number: addAdmissionNumber,
            date_of_birth: addDateOfBirth || null,
            gender: addGender || null,
            height_cm: addHeightCm ? Number(addHeightCm) : null,
            weight_kg: addWeightKg ? Number(addWeightKg) : null,
            passport_url: null,
            created_at: new Date().toISOString(),
          };
          setPassportUploadTarget(newlyCreatedStudent);
        }
      }
    });
  };

  // --- Handlers: Edit Student ---
  const handleOpenEditModal = (student: StudentWithSignedUrl) => {
    setEditingStudent(student);
    setEditFullName(student.full_name);
    setEditClassId(student.class_id || (classes.length > 0 ? classes[0].id : ''));
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

    // Client-side Sanity Checks for Height & Weight
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
      admissionNumber: editAdmissionNumber.trim() || null,
      dateOfBirth: editDateOfBirth.trim() || null,
      gender: editGender.trim() || null,
      heightCm: editHeightCm.trim() ? Number(editHeightCm) : null,
      weightKg: editWeightKg.trim() ? Number(editWeightKg) : null,
    };

    startTransition(async () => {
      const res = await updateStudentAction(editingStudent.id, payload);

      if (res.error) {
        setEditError(res.error);
      } else {
        const clsName = classes.find((c) => c.id === editClassId)?.name;
        setSuccessMessage(`Updated student details for ${editFullName} (${clsName}).`);
        setEditingStudent(null);
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
              Add & Manage Students
            </h1>
          </div>
          <p className="text-olive-700 text-sm font-medium">
            Manage student profiles, record DOB, gender, height/weight, assign classes, and upload passport photos.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 bg-schoolYellow-500 hover:bg-schoolYellow-400 text-olive-950 font-bold text-sm rounded-xl shadow-sm flex items-center justify-center space-x-2 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add New Student</span>
        </button>
      </div>

      {/* Global Success Feedback */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-900 text-sm">
          <div className="flex items-center space-x-2 font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-950"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-olive-200 shadow-2xs flex items-center space-x-3">
        <Search className="w-5 h-5 text-olive-400 shrink-0" />
        <input
          type="text"
          placeholder="Search student by name or admission number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-sm font-medium text-olive-900 focus:outline-none placeholder:text-olive-400"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs font-bold text-olive-500 hover:text-olive-800"
          >
            Clear
          </button>
        )}
      </div>

      {/* Class-Grouped Student List */}
      <div className="space-y-6">
        {classes.length === 0 ? (
          <div className="p-8 text-center bg-white border-2 border-dashed border-olive-200 rounded-2xl">
            <School className="w-10 h-10 text-olive-400 mx-auto mb-2" />
            <p className="text-olive-700 font-semibold text-sm">
              No classes created yet. Please create a class first.
            </p>
          </div>
        ) : (
          classes.map((cls) => {
            const classStudents = studentsByClass[cls.id] || [];
            return (
              <div
                key={cls.id}
                className="bg-white rounded-2xl border border-olive-200 shadow-sm overflow-hidden"
              >
                {/* Class Group Header */}
                <div className="p-5 bg-olive-50/80 border-b border-olive-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <GraduationCap className="w-5 h-5 text-olive-800" />
                    <h2 className="font-extrabold text-olive-900 text-base">
                      {cls.name}
                    </h2>
                    <span className="px-2.5 py-0.5 bg-olive-200/60 text-olive-800 rounded-full text-xs font-bold">
                      {classStudents.length} Students
                    </span>
                  </div>
                </div>

                {/* Class Student Cards Grid */}
                {classStudents.length === 0 ? (
                  <div className="p-6 text-center text-xs text-olive-500 font-medium italic">
                    No students currently enrolled in {cls.name}.
                  </div>
                ) : (
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classStudents.map((student) => (
                      <div
                        key={student.id}
                        className="p-4 rounded-xl border border-olive-200 bg-white hover:border-olive-300 shadow-2xs transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center space-x-3.5 min-w-0">
                          {/* Passport Thumbnail with Placeholder Fallback */}
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
                            <h3 className="font-bold text-sm text-olive-950 truncate flex items-center space-x-1.5">
                              <span className="truncate">{student.full_name}</span>
                            </h3>
                            {student.admission_number && (
                              <p className="text-xs font-semibold text-olive-700 font-mono">
                                Adm #: <span className="text-olive-950 font-bold">{student.admission_number}</span>
                              </p>
                            )}
                            <p className="text-2xs text-olive-500 font-medium">
                              {student.signedPassportUrl ? 'Photo Uploaded' : 'No Photo Uploaded'}
                            </p>
                          </div>
                        </div>

                        {/* Student Actions */}
                        <div className="flex items-center space-x-1 shrink-0">
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
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Unassigned Students Section if any */}
        {unassignedStudents.length > 0 && (
          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
            <div className="p-5 bg-amber-50 border-b border-amber-200 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <h2 className="font-extrabold text-amber-900 text-base">
                Unassigned Students ({unassignedStudents.length})
              </h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {unassignedStudents.map((student) => (
                <div
                  key={student.id}
                  className="p-4 rounded-xl border border-amber-200 bg-white flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-olive-900 block">
                        {student.full_name}
                      </span>
                      {student.admission_number && (
                        <span className="text-2xs font-mono text-olive-600">
                          {student.admission_number}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenEditModal(student)}
                    className="px-3 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-lg hover:bg-amber-200 cursor-pointer"
                  >
                    Assign Class
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL 1: ADD STUDENT ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-olive-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-olive-200 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-6 bg-olive-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-schoolYellow-500 flex items-center justify-center text-olive-950 font-bold">
                  <Plus className="w-5 h-5 stroke-[3]" />
                </div>
                <h2 className="font-extrabold text-lg tracking-tight">Add New Student</h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                disabled={isPending}
                className="p-1 text-olive-300 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={addFullName}
                    onChange={(e) => setAddFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
                  />
                </div>

                {/* Admission Number */}
                <div>
                  <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                    Admission Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ADM-2026-001"
                    value={addAdmissionNumber}
                    onChange={(e) => setAddAdmissionNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Class */}
                <div>
                  <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                    Class <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={addClassId}
                    onChange={(e) => setAddClassId(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
                  >
                    <option value="">-- Select Class --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date of Birth */}
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Gender */}
                <div>
                  <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                    Gender
                  </label>
                  <select
                    value={addGender}
                    onChange={(e) => setAddGender(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
                  >
                    <option value="">-- Gender --</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                {/* Height (cm) */}
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

                {/* Weight (kg) */}
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

              <p className="text-2xs text-olive-600 font-medium pt-1">
                Note: Passport photo can be uploaded immediately after adding or anytime later.
              </p>

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
                  disabled={isPending || !addFullName.trim() || !addClassId || !addAdmissionNumber.trim()}
                  className="px-5 py-2 bg-schoolYellow-500 hover:bg-schoolYellow-400 text-olive-950 font-bold text-xs rounded-xl shadow-sm flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>Create Student</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: EDIT STUDENT ================= */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-olive-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-olive-200 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-6 bg-olive-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-schoolYellow-500 flex items-center justify-center text-olive-950 font-bold">
                  <Edit2 className="w-4 h-4 stroke-[2.5]" />
                </div>
                <h2 className="font-extrabold text-lg tracking-tight">Edit Student Details</h2>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                disabled={isPending}
                className="p-1 text-olive-300 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
                  />
                </div>

                {/* Admission Number */}
                <div>
                  <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                    Admission Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ADM-2026-001"
                    value={editAdmissionNumber}
                    onChange={(e) => setEditAdmissionNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Class */}
                <div>
                  <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                    Assigned Class <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editClassId}
                    onChange={(e) => setEditClassId(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date of Birth */}
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Gender */}
                <div>
                  <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                    Gender
                  </label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
                  >
                    <option value="">-- Gender --</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                {/* Height (cm) */}
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

                {/* Weight (kg) */}
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
    </div>
  );
}
