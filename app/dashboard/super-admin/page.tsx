/**
 * @file app/dashboard/super-admin/page.tsx
 * @description Super Admin Dashboard landing page for Eduland School Portal.
 * Provides system-level management controls and direct access to school administration features
 * (Manage Students, Manage Classes & Subjects, Teacher Assignments, Promote Students, and Admin Dashboard).
 */

import { requireRole } from '@/lib/auth/guard';
import Link from 'next/link';
import { ShieldCheck, Layers, Users, ArrowRight, Building, Trash2, UserCheck, UserPlus } from 'lucide-react';

export default async function SuperAdminDashboardPage() {
  const { profile } = await requireRole('super_admin');

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Welcome & Navigation Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-olive-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-3 h-8 bg-schoolYellow-500 rounded-full" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-olive-900 tracking-tight">
              Super Admin Dashboard
            </h1>
          </div>
          <p className="text-olive-700 font-medium text-sm">
            Welcome back, <span className="font-bold text-olive-900">{profile?.full_name || 'Super Admin'}</span>! You have full system and administrative privileges.
          </p>
        </div>

        <Link
          href="/dashboard/admin"
          className="px-5 py-2.5 bg-olive-900 hover:bg-olive-800 text-white font-bold text-sm rounded-xl shadow-sm flex items-center justify-center space-x-2 transition-all shrink-0 cursor-pointer"
        >
          <Building className="w-4 h-4 text-schoolYellow-400" />
          <span>Open School Admin Dashboard</span>
        </Link>
      </div>

      {/* School Management Section for Super Admin */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-schoolYellow-600" />
          <h2 className="text-lg font-bold text-olive-900">
            School Administrative Controls (Super Admin Access)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Add & Manage Students */}
          <Link
            href="/dashboard/admin/students"
            className="group bg-white rounded-2xl p-6 border border-olive-200 hover:border-olive-400 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-schoolYellow-100 group-hover:bg-olive-800 transition-colors flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-olive-900 group-hover:text-schoolYellow-400 transition-colors" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-schoolYellow-700 bg-schoolYellow-50 border border-schoolYellow-200 px-2.5 py-0.5 rounded-full">
                  Profiles & Photos
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-olive-900 mb-2 group-hover:text-olive-800 transition-colors">
                Add & Manage Students
              </h3>
              <p className="text-olive-600 text-xs mb-6">
                Add student profiles, edit details, and upload canvas-compressed passport photos.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs font-bold text-olive-800 group-hover:text-olive-950 pt-4 border-t border-olive-100">
              <span>Manage Students & Photos</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Card 2: Manage Classes & Subjects */}
          <Link
            href="/dashboard/admin/classes-subjects"
            className="group bg-white rounded-2xl p-6 border border-olive-200 hover:border-olive-400 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-olive-100 group-hover:bg-olive-800 transition-colors flex items-center justify-center">
                  <Layers className="w-6 h-6 text-olive-800 group-hover:text-schoolYellow-400 transition-colors" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                  <Trash2 className="w-3 h-3" />
                  <span>Full Edit/Delete</span>
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-olive-900 mb-2 group-hover:text-olive-800 transition-colors">
                Classes & Subjects
              </h3>
              <p className="text-olive-600 text-xs mb-6">
                Configure school classes and subjects. Super Admin role includes exclusive class deletion rights.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs font-bold text-olive-800 group-hover:text-olive-950 pt-4 border-t border-olive-100">
              <span>Manage Classes</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Card 3: Teacher Assignments */}
          <Link
            href="/dashboard/admin/teacher-assignments"
            className="group bg-white rounded-2xl p-6 border border-olive-200 hover:border-olive-400 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-schoolYellow-100 group-hover:bg-olive-800 transition-colors flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-olive-900 group-hover:text-schoolYellow-400 transition-colors" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-schoolYellow-700 bg-schoolYellow-50 border border-schoolYellow-200 px-2.5 py-0.5 rounded-full">
                  Subject & Class
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-olive-900 mb-2 group-hover:text-olive-800 transition-colors">
                Teacher Assignments
              </h3>
              <p className="text-olive-600 text-xs mb-6">
                Assign subject teachers per class and set designated class teachers.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs font-bold text-olive-800 group-hover:text-olive-950 pt-4 border-t border-olive-100">
              <span>Teacher Assignments</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Card 4: Promote / Move Students */}
          <Link
            href="/dashboard/admin/students/promote"
            className="group bg-white rounded-2xl p-6 border border-olive-200 hover:border-olive-400 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-olive-100 group-hover:bg-olive-800 transition-colors flex items-center justify-center">
                  <Users className="w-6 h-6 text-olive-800 group-hover:text-schoolYellow-400 transition-colors" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-schoolYellow-700 bg-schoolYellow-50 border border-schoolYellow-200 px-2.5 py-0.5 rounded-full">
                  Transfer & History
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-olive-900 mb-2 group-hover:text-olive-800 transition-colors">
                Promote & Move
              </h3>
              <p className="text-olive-600 text-xs mb-6">
                Transfer students between classes with session-based enrollment history logging.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs font-bold text-olive-800 group-hover:text-olive-950 pt-4 border-t border-olive-100">
              <span>Transfer & Promote</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
