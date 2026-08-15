/**
 * @file app/dashboard/teacher/page.tsx
 * @description Teacher Dashboard landing page with quick action links to Gradebook Entry.
 */

import { requireRole } from '@/lib/auth/guard';
import Link from 'next/link';
import { BookOpen, ArrowRight, Award, UserCheck } from 'lucide-react';

export default async function TeacherDashboardPage() {
  const { profile } = await requireRole(['teacher', 'admin', 'super_admin']);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-olive-200 shadow-sm">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-3 h-8 bg-schoolYellow-500 rounded-full" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-olive-900 tracking-tight">
            Teacher Dashboard
          </h1>
        </div>
        <p className="text-olive-700 font-medium">
          Welcome back, <span className="font-bold text-olive-950">{profile?.full_name || 'Teacher'}</span>! Access your assigned gradebook and entry tools below.
        </p>
      </div>

      {/* Quick Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Gradebook Entry Card */}
        <Link
          href="/dashboard/teacher/gradebook"
          className="group bg-white rounded-2xl p-6 border border-olive-200 shadow-sm hover:shadow-md transition-all hover:border-schoolYellow-400 flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-schoolYellow-100 text-olive-950 font-bold flex items-center justify-center mb-4 border border-schoolYellow-300 group-hover:scale-105 transition-transform">
              <BookOpen className="w-6 h-6 text-olive-900" />
            </div>
            <h2 className="text-lg font-extrabold text-olive-950 mb-2 group-hover:text-amber-800 transition-colors">
              Gradebook Entry
            </h2>
            <p className="text-xs text-olive-700 leading-relaxed font-medium mb-6">
              Enter and update Homework, Classwork, and Test scores for your assigned subjects and classes.
            </p>
          </div>

          <div className="pt-4 border-t border-olive-100 flex items-center justify-between text-xs font-bold text-olive-900 group-hover:text-amber-900">
            <span className="flex items-center space-x-1">
              <Award className="w-3.5 h-3.5 text-schoolYellow-600" />
              <span>Score Recording</span>
            </span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* Class Attendance Entry Card */}
        <Link
          href="/dashboard/teacher/attendance"
          className="group bg-white rounded-2xl p-6 border border-olive-200 shadow-sm hover:shadow-md transition-all hover:border-schoolYellow-400 flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-olive-100 text-olive-950 font-bold flex items-center justify-center mb-4 border border-olive-300 group-hover:scale-105 transition-transform">
              <UserCheck className="w-6 h-6 text-olive-900" />
            </div>
            <h2 className="text-lg font-extrabold text-olive-950 mb-2 group-hover:text-amber-800 transition-colors">
              Class Attendance
            </h2>
            <p className="text-xs text-olive-700 leading-relaxed font-medium mb-6">
              Record term opening days and student attendance. Access restricted to designated Class Teachers.
            </p>
          </div>

          <div className="pt-4 border-t border-olive-100 flex items-center justify-between text-xs font-bold text-olive-900 group-hover:text-amber-900">
            <span className="flex items-center space-x-1">
              <UserCheck className="w-3.5 h-3.5 text-schoolYellow-600" />
              <span>Class Teacher Portal</span>
            </span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </div>
    </div>
  );
}
