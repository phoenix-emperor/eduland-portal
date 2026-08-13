'use client';

import { useActionState } from 'react';
import { loginAction, FormState } from '@/app/auth/actions';
import { GraduationCap, Lock, Mail, Loader2, ShieldAlert } from 'lucide-react';

const initialState: FormState = {
  error: null,
};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <div className="min-h-screen bg-olive-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Top Header / Branding Banner */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-16 h-16 bg-olive-700 rounded-2xl flex items-center justify-center shadow-lg border-2 border-schoolYellow-400 mb-4">
          <GraduationCap className="w-10 h-10 text-schoolYellow-400" />
        </div>
        <h2 className="text-3xl font-extrabold text-olive-900 tracking-tight">
          Eduland School Portal
        </h2>
        <p className="mt-2 text-sm font-medium text-olive-700">
          Sign in to access your role-based reporting dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-olive-200 sm:px-10">
          <form className="space-y-6" action={formAction}>
            {state?.error && (
              <div className="rounded-lg bg-red-50 p-4 border border-red-200 text-sm text-red-800 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <span>{state.error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-olive-900">
                Email Address
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-olive-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="user@school.edu"
                  className="block w-full pl-10 pr-3 py-2.5 border border-olive-200 rounded-lg text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500 focus:border-olive-600 sm:text-sm bg-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-olive-900">
                Password
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-olive-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 border border-olive-200 rounded-lg text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500 focus:border-olive-600 sm:text-sm bg-white"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isPending}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-olive-950 bg-schoolYellow-500 hover:bg-schoolYellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-schoolYellow-500 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-olive-950" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
