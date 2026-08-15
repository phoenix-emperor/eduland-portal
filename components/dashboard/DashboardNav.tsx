'use client';

/**
 * @file components/dashboard/DashboardNav.tsx
 * @description Shared, reusable navigation bar shell used across Admin, Super Admin, and Teacher dashboards.
 * Renders role-specific navigation links with active tab highlighting, hover transitions,
 * and mobile-responsive horizontal scrolling.
 * Maps serializable iconName strings to Lucide icons on the client to comply with RSC serialization boundaries.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavLinkItem, IconKey } from './navLinks';
import {
  LayoutDashboard,
  BookOpen,
  UserCheck,
  GraduationCap,
  Calendar,
  Users,
  MessageSquare,
} from 'lucide-react';

const iconMap: Record<IconKey, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  classes: BookOpen,
  assignments: UserCheck,
  students: GraduationCap,
  terms: Calendar,
  users: Users,
  gradebook: BookOpen,
  attendance: UserCheck,
  comments: MessageSquare,
  subjects: BookOpen,
};

interface DashboardNavProps {
  links: NavLinkItem[];
}

export function DashboardNav({ links }: DashboardNavProps) {
  const pathname = usePathname();

  // Helper to determine whether a link is active
  const checkIsActive = (href: string) => {
    // Root dashboard pages require an exact match to avoid highlighting Dashboard on sub-pages
    if (
      href === '/dashboard/admin' ||
      href === '/dashboard/super-admin' ||
      href === '/dashboard/teacher'
    ) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-olive-900 border-b border-olive-700/80 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-1.5 sm:space-x-2 py-2 overflow-x-auto whitespace-nowrap scrollbar-none">
          {links.map((link) => {
            const isActive = checkIsActive(link.href);
            const Icon = iconMap[link.iconName] || LayoutDashboard;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm transition-all shrink-0 ${
                  isActive
                    ? 'bg-schoolYellow-500 text-olive-950 font-extrabold shadow-sm'
                    : 'text-olive-200 hover:text-white hover:bg-olive-800/80 font-bold'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-olive-950' : 'text-olive-300'}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
