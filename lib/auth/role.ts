/**
 * @file lib/auth/role.ts
 * @description Helper functions for role normalization, dashboard path resolution, and route segment parsing.
 */

import { UserRole } from '@/lib/types/database';

/**
 * Returns the target dashboard URL path corresponding to a user role string.
 * Normalizes input against case and delimiter variations (e.g. `super_admin`, `superadmin`, `super-admin`).
 * 
 * @param role - The user role string to map.
 * @returns Target URL path string (e.g. `/dashboard/teacher`).
 */
export function getDashboardPathForRole(role: UserRole | string | null | undefined): string {
  if (!role) return '/dashboard/parent';
  const clean = role.toLowerCase().trim().replace(/[-_]/g, '');
  switch (clean) {
    case 'parent':
      return '/dashboard/parent';
    case 'teacher':
      return '/dashboard/teacher';
    case 'admin':
      return '/dashboard/admin';
    case 'superadmin':
      return '/dashboard/super-admin';
    default:
      return '/dashboard/parent';
  }
}

/**
 * Maps a URL segment string back to a valid `UserRole` enum value.
 * 
 * @param segment - The URL path segment (e.g. `super-admin`).
 * @returns Corresponding `UserRole` value or `null` if invalid.
 */
export function getRoleFromSegment(segment: string): UserRole | null {
  switch (segment) {
    case 'parent':
      return 'parent';
    case 'teacher':
      return 'teacher';
    case 'admin':
      return 'admin';
    case 'super-admin':
      return 'super_admin';
    default:
      return null;
  }
}
