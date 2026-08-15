/**
 * @file components/dashboard/navLinks.ts
 * @description Role-specific navigation link definitions for Eduland Portal dashboards.
 * Uses plain serializable string icon keys (iconName) so objects can cross RSC boundaries without serialization errors.
 */

export type IconKey =
  | 'dashboard'
  | 'classes'
  | 'assignments'
  | 'students'
  | 'terms'
  | 'users'
  | 'gradebook'
  | 'attendance'
  | 'comments'
  | 'subjects';

export interface NavLinkItem {
  label: string;
  href: string;
  iconName: IconKey;
}

/** Navigation links for School Admin role */
export const adminNavLinks: NavLinkItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard/admin',
    iconName: 'dashboard',
  },
  {
    label: 'Classes & Subjects',
    href: '/dashboard/admin/classes-subjects',
    iconName: 'classes',
  },
  {
    label: 'Teacher Assignments',
    href: '/dashboard/admin/teacher-assignments',
    iconName: 'assignments',
  },
  {
    label: 'Students',
    href: '/dashboard/admin/students',
    iconName: 'students',
  },
  {
    label: 'Terms',
    href: '/dashboard/admin/terms',
    iconName: 'terms',
  },
  {
    label: 'Users',
    href: '/dashboard/admin/users',
    iconName: 'users',
  },
];

/** Navigation links for Super Admin role */
export const superAdminNavLinks: NavLinkItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard/super-admin',
    iconName: 'dashboard',
  },
  {
    label: 'Classes & Subjects',
    href: '/dashboard/admin/classes-subjects',
    iconName: 'classes',
  },
  {
    label: 'Teacher Assignments',
    href: '/dashboard/admin/teacher-assignments',
    iconName: 'assignments',
  },
  {
    label: 'Students',
    href: '/dashboard/admin/students',
    iconName: 'students',
  },
  {
    label: 'Terms',
    href: '/dashboard/admin/terms',
    iconName: 'terms',
  },
  {
    label: 'Users',
    href: '/dashboard/admin/users',
    iconName: 'users',
  },
];

/** Navigation links for Teacher role */
export const teacherNavLinks: NavLinkItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard/teacher',
    iconName: 'dashboard',
  },
  {
    label: 'Gradebook',
    href: '/dashboard/teacher/gradebook',
    iconName: 'gradebook',
  },
  {
    label: 'Attendance',
    href: '/dashboard/teacher/attendance',
    iconName: 'attendance',
  },
  {
    label: 'General Comments',
    href: '/dashboard/teacher/comments',
    iconName: 'comments',
  },
  {
    label: 'My Subjects',
    href: '/dashboard/teacher/subjects',
    iconName: 'subjects',
  },
];

/** Navigation links for Parent role */
export const parentNavLinks: NavLinkItem[] = [
  {
    label: 'Current Report',
    href: '/dashboard/parent',
    iconName: 'dashboard',
  },
  {
    label: 'Report History',
    href: '/dashboard/parent/history',
    iconName: 'terms',
  },
];
