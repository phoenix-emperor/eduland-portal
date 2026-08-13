import { signOutAction } from '@/app/auth/actions';

interface DashboardHeaderProps {
  fullName: string;
  roleDisplayName: string;
}

export function DashboardHeader({ fullName, roleDisplayName }: DashboardHeaderProps) {
  return (
    <header className="bg-olive-800 text-white shadow-md border-b-4 border-schoolYellow-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-schoolYellow-500 text-olive-950 font-black rounded-lg flex items-center justify-center text-lg shadow">
            EP
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Eduland Portal</h1>
            <p className="text-xs text-olive-200">School Reporting Platform</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-white">{fullName || 'User'}</p>
            <span className="inline-block bg-schoolYellow-400 text-olive-950 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
              {roleDisplayName}
            </span>
          </div>

          <form action={signOutAction}>
            <button
              type="submit"
              className="bg-schoolYellow-500 hover:bg-schoolYellow-400 text-olive-950 font-bold text-xs sm:text-sm px-4 py-2 rounded-lg transition-colors shadow focus:outline-none focus:ring-2 focus:ring-schoolYellow-400 cursor-pointer"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
