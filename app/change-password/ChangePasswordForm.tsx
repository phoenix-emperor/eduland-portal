'use client';

/**
 * @file app/change-password/ChangePasswordForm.tsx
 * @description Client Component form for forced first-login password change.
 */

import { useState, useTransition } from 'react';
import { changePasswordAction } from './actions';
import { Lock, ShieldAlert, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

export default function ChangePasswordForm({ userEmail }: { userEmail: string }) {
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    startTransition(async () => {
      const res = await changePasswordAction(newPassword);
      if (res?.error) {
        setError(res.error);
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-olive-200 shadow-xl overflow-hidden max-w-md w-full">
      {/* Card Header */}
      <div className="p-6 bg-olive-900 text-white space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-schoolYellow-500 flex items-center justify-center text-olive-950 font-bold">
            <Lock className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight">Set New Password</h1>
            <p className="text-xs text-olive-300 font-medium">First-time Login Requirement</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2.5 text-amber-900 text-xs font-medium">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            Logged in as <strong className="font-bold">{userEmail}</strong>. You are required to choose a new password before accessing your dashboard.
          </span>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-xs font-bold uppercase text-olive-900 mb-1.5">
            New Password <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            placeholder="Minimum 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            className="w-full px-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
          />
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-bold uppercase text-olive-900 mb-1.5">
            Confirm New Password <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className="w-full px-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
          />
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || !newPassword || !confirmPassword}
          className="w-full py-3 bg-schoolYellow-500 hover:bg-schoolYellow-400 text-olive-950 font-bold text-sm rounded-xl shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50 transition-colors cursor-pointer"
        >
          {isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span>Save & Continue to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
