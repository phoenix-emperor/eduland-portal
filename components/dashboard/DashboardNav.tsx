'use client';

/**
 * @file components/dashboard/DashboardNav.tsx
 * @description Shared, reusable navigation bar shell used across Admin, Super Admin, and Teacher dashboards.
 * Renders role-specific navigation links with active tab highlighting, hover transitions,
 * and a compact, touch-friendly disclosure menu on mobile screens.
 * Maps serializable iconName strings to Lucide icons on the client to comply with RSC serialization boundaries.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { NavLinkItem, IconKey } from './navLinks';
import {
  LayoutDashboard,
  BookOpen,
  UserCheck,
  GraduationCap,
  Calendar,
  Users,
  MessageSquare,
  FileText,
  Menu,
  X,
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
  reports: FileText,
};

interface DashboardNavProps {
  links: NavLinkItem[];
}

export function DashboardNav({ links }: DashboardNavProps) {
  const pathname = usePathname();
  // This state controls only the compact mobile menu; links and access rules stay unchanged.
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Helper to determine whether a link is active
  const checkIsActive = (href: string) => {
    // Root dashboard pages require an exact match to avoid highlighting Dashboard on sub-pages
    if (
      href === '/dashboard/admin' ||
      href === '/dashboard/super-admin' ||
      href === '/dashboard/teacher' ||
      href === '/dashboard/parent'
    ) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-olive-900 border-b border-olive-700/80 shadow-md print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile exposes the same links in a touch-friendly disclosure instead of a clipped scrolling row. */}
        <div className="flex sm:hidden items-center justify-between py-2.5">
          <span className="text-sm font-bold text-white">Menu</span>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="dashboard-mobile-navigation"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-olive-100 transition-colors hover:bg-olive-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-schoolYellow-400"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span>{isMobileMenuOpen ? 'Close' : 'Navigate'}</span>
          </button>
        </div>

        <div
          id="dashboard-mobile-navigation"
          className={`${isMobileMenuOpen ? 'grid' : 'hidden'} sm:hidden grid-cols-1 gap-1 border-t border-olive-700/80 py-2`}
        >
          {links.map((link) => {
            const isActive = checkIsActive(link.href);
            const Icon = iconMap[link.iconName] || LayoutDashboard;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-schoolYellow-500 text-olive-950 font-extrabold shadow-sm'
                    : 'text-olive-100 hover:bg-olive-800 hover:text-white font-bold'
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-olive-950' : 'text-olive-300'}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Desktop and tablet retain the existing always-visible navigation. */}
        <div className="hidden sm:flex items-center space-x-2 py-2 overflow-x-auto whitespace-nowrap scrollbar-none">
          {links.map((link) => {
            const isActive = checkIsActive(link.href);
            const Icon = iconMap[link.iconName] || LayoutDashboard;

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? 'page' : undefined}
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

export default DashboardNav;
