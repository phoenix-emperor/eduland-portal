import { requireRole } from '@/lib/auth/guard';

export default async function TeacherDashboardPage() {
  const { profile } = await requireRole('teacher');

  return (
    <div className="bg-white rounded-2xl p-8 border border-olive-200 shadow-md">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-3 h-8 bg-schoolYellow-500 rounded-full" />
        <h2 className="text-2xl font-extrabold text-olive-900">
          Teacher Dashboard
        </h2>
      </div>
      <p className="text-olive-700 font-medium mb-6">
        Welcome, <span className="font-bold text-olive-900">{profile?.full_name || 'Teacher'}</span>!
      </p>
      <div className="p-4 bg-olive-50 rounded-xl border border-olive-200 text-sm text-olive-800">
        Role: <span className="font-semibold text-olive-950">teacher</span> — Phase 2 shell loaded successfully. Grade entry and reporting modules will be implemented in Phase 3.
      </div>
    </div>
  );
}
