/**
 * @file app/dashboard/admin/page.tsx
 * @description School Admin Dashboard landing page for Eduland School Portal.
 * Provides quick access cards to Phase 3 management workflows.
 */

import { requireRole } from '@/lib/auth/guard';
import Link from 'next/link';
import { GraduationCap, Users, ArrowRight, BookOpen, Layers, UserCheck, UserPlus, Calendar, ShieldCheck } from 'lucide-react';

export default async function AdminDashboardPage() {
  const { profile } = await requireRole(['admin', 'super_admin']);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-olive-200 shadow-sm">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-3 h-8 bg-schoolYellow-500 rounded-full" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-olive-900 tracking-tight">
            School Admin Dashboard
          </h1>
        </div>
        <p className="text-olive-700 font-medium text-sm">
          Welcome back, <span className="font-bold text-olive-900">{profile?.full_name || 'Admin'}</span>! Manage user accounts, school terms, classes, subjects, teacher assignments, and student profiles.
        </p>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Manage Users & Invites */}
        <Link
          href="/dashboard/admin/users"
          className="group bg-white rounded-2xl p-6 border border-olive-200 hover:border-olive-400 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-schoolYellow-100 group-hover:bg-olive-800 transition-colors flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-olive-900 group-hover:text-schoolYellow-400 transition-colors" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-schoolYellow-600 bg-schoolYellow-50 border border-schoolYellow-200 px-2.5 py-0.5 rounded-full">
                Phase 3 Active
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-olive-900 mb-2 group-hover:text-olive-800 transition-colors">
              Manage Users & Invites
            </h2>
            <p className="text-olive-600 text-xs mb-6">
              Invite new staff/parents via email and assign user account roles (Parent, Teacher, Admin).
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-bold text-olive-800 group-hover:text-olive-950 pt-4 border-t border-olive-100">
            <span>Users & Role Invites</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* Card 2: Add & Manage Students */}
        <Link
          href="/dashboard/admin/students"
          className="group bg-white rounded-2xl p-6 border border-olive-200 hover:border-olive-400 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-schoolYellow-100 group-hover:bg-olive-800 transition-colors flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-olive-900 group-hover:text-schoolYellow-400 transition-colors" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-schoolYellow-600 bg-schoolYellow-50 border border-schoolYellow-200 px-2.5 py-0.5 rounded-full">
                Phase 3 Active
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-olive-900 mb-2 group-hover:text-olive-800 transition-colors">
              Add & Manage Students
            </h2>
            <p className="text-olive-600 text-xs mb-6">
              Add student profiles, edit details, and upload compressed passport photos with canvas optimization.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-bold text-olive-800 group-hover:text-olive-950 pt-4 border-t border-olive-100">
            <span>Manage Students & Photos</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* Card 3: Manage Academic Terms */}
        <Link
          href="/dashboard/admin/terms"
          className="group bg-white rounded-2xl p-6 border border-olive-200 hover:border-olive-400 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-schoolYellow-100 group-hover:bg-olive-800 transition-colors flex items-center justify-center">
                <Calendar className="w-6 h-6 text-olive-900 group-hover:text-schoolYellow-400 transition-colors" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-schoolYellow-600 bg-schoolYellow-50 border border-schoolYellow-200 px-2.5 py-0.5 rounded-full">
                Phase 3 Active
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-olive-900 mb-2 group-hover:text-olive-800 transition-colors">
              Academic Terms
            </h2>
            <p className="text-olive-600 text-xs mb-6">
              Configure academic sessions, term names, and next term resumption dates.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-bold text-olive-800 group-hover:text-olive-950 pt-4 border-t border-olive-100">
            <span>Manage Academic Terms</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* Card 4: Manage Classes & Subjects */}
        <Link
          href="/dashboard/admin/classes-subjects"
          className="group bg-white rounded-2xl p-6 border border-olive-200 hover:border-olive-400 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-olive-100 group-hover:bg-olive-800 transition-colors flex items-center justify-center">
                <Layers className="w-6 h-6 text-olive-800 group-hover:text-schoolYellow-400 transition-colors" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-schoolYellow-600 bg-schoolYellow-50 border border-schoolYellow-200 px-2.5 py-0.5 rounded-full">
                Phase 3 Active
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-olive-900 mb-2 group-hover:text-olive-800 transition-colors">
              Classes & Subjects
            </h2>
            <p className="text-olive-600 text-xs mb-6">
              Create and rename academic classes and subjects. View live student enrollment counts.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-bold text-olive-800 group-hover:text-olive-950 pt-4 border-t border-olive-100">
            <span>Configure Classes</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* Card 5: Manage Teacher Assignments */}
        <Link
          href="/dashboard/admin/teacher-assignments"
          className="group bg-white rounded-2xl p-6 border border-olive-200 hover:border-olive-400 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-schoolYellow-100 group-hover:bg-olive-800 transition-colors flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-olive-900 group-hover:text-schoolYellow-400 transition-colors" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-schoolYellow-600 bg-schoolYellow-50 border border-schoolYellow-200 px-2.5 py-0.5 rounded-full">
                Phase 3 Active
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-olive-900 mb-2 group-hover:text-olive-800 transition-colors">
              Teacher Assignments
            </h2>
            <p className="text-olive-600 text-xs mb-6">
              Assign subject teachers and designate class teachers responsible for attendance and comments.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-bold text-olive-800 group-hover:text-olive-950 pt-4 border-t border-olive-100">
            <span>Teacher Assignments</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* Card 6: Promote / Move Students */}
        <Link
          href="/dashboard/admin/students/promote"
          className="group bg-white rounded-2xl p-6 border border-olive-200 hover:border-olive-400 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-olive-100 group-hover:bg-olive-800 transition-colors flex items-center justify-center">
                <Users className="w-6 h-6 text-olive-800 group-hover:text-schoolYellow-400 transition-colors" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-schoolYellow-600 bg-schoolYellow-50 border border-schoolYellow-200 px-2.5 py-0.5 rounded-full">
                Phase 3 Active
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-olive-900 mb-2 group-hover:text-olive-800 transition-colors">
              Promote & Move
            </h2>
            <p className="text-olive-600 text-xs mb-6">
              Transfer students between classes while preserving their academic session enrollment history.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-bold text-olive-800 group-hover:text-olive-950 pt-4 border-t border-olive-100">
            <span>Transfer & Promote</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </div>
    </div>
  );
}
