# Eduland Portal Codebase Guide

## Purpose and technology

Eduland Portal is a multi-role school reporting system. It uses the Next.js 16 App Router for pages and server actions, Supabase for identity and school data, Tailwind CSS for styling, and Resend for account-related email.

The project keeps route code in `app/` and reusable UI in `components/`. Files named `page.tsx` are routes; `layout.tsx` files wrap their child routes. Client components begin with `'use client'`; they provide browser interaction but must not hold privileged credentials.

## Start here

| Need | Start with |
| --- | --- |
| Site-wide metadata, fonts, and CSS | `app/layout.tsx`, `app/globals.css` |
| Login and sign-out | `app/login/page.tsx`, `app/auth/actions.ts` |
| Session and role enforcement | `proxy.ts`, `lib/auth/guard.ts`, `lib/auth/role.ts` |
| Shared dashboard header/navigation | `components/dashboard/Header.tsx`, `DashboardNav.tsx`, `navLinks.ts` |
| Admin mutations | `app/dashboard/admin/actions.ts` |
| Teacher mutations | `app/dashboard/teacher/actions.ts` |
| Database contract | `lib/types/database.ts`, `supabase/migrations/` |

## Route map

| URL | Who can use it | What it does |
| --- | --- | --- |
| `/` | Anyone | Redirects to `/dashboard`. |
| `/login` | Signed-out users | Email/password sign-in. Authenticated users are redirected by `proxy.ts`. |
| `/change-password` | Authenticated users | Required first-login/password-reset change. |
| `/dashboard` | Authenticated users | Reads the profile role and redirects to the appropriate dashboard. |
| `/dashboard/admin` | Admin, Super Admin | Administrative overview and operational links. |
| `/dashboard/admin/classes-subjects` | Admin, Super Admin | Classes and subjects management. |
| `/dashboard/admin/teacher-assignments` | Admin, Super Admin | Subject and class-teacher assignments. |
| `/dashboard/admin/students` | Admin, Super Admin | Student records, photos, and guardian links. |
| `/dashboard/admin/students/promote` | Admin, Super Admin | Session-based student moves/promotions. |
| `/dashboard/admin/reports` | Admin, Super Admin | School report viewing/printing. |
| `/dashboard/admin/terms` | Admin, Super Admin | Terms, sessions, grading keys. |
| `/dashboard/admin/users` | Admin, Super Admin | User invitations, profiles, account status, and resets. |
| `/dashboard/super-admin` | Super Admin | System-level overview; links into permitted admin tooling. |
| `/dashboard/teacher` | Teacher | Teacher overview. |
| `/dashboard/teacher/gradebook` | Teacher | Score entry for assigned class/subjects. |
| `/dashboard/teacher/attendance` | Teacher | Class-teacher attendance entry. |
| `/dashboard/teacher/comments` | Teacher | Class-teacher report comments. |
| `/dashboard/teacher/subjects` | Teacher | View/manage the teacher’s assignments. |
| `/dashboard/parent` | Parent | Current report for linked children. |
| `/dashboard/parent/history` | Parent | Historical reports for linked children. |

The dashboard layouts (`admin`, `teacher`, `parent`, and `super-admin`) use `requireRole` before rendering. The shared navbar only presents links; direct requests are still evaluated by the layout and server actions.

## Authentication and authorization flow

1. `proxy.ts` refreshes the Supabase session and stops unauthenticated access to `/dashboard/*`.
2. `loginAction` signs in with Supabase Auth, reads `profiles.role`, then redirects through `getDashboardPathForRole`.
3. Each dashboard layout calls `requireRole`, which verifies the user, reads their `profiles` record, rejects disabled accounts, forces password changes, and checks the accepted roles.
4. Server actions repeat role checks before writing. Row Level Security policies in the migrations provide the database-level authorization boundary.

`lib/supabase/server.ts` is for Server Components and Server Actions; `lib/supabase/client.ts` is for browser code. `lib/supabase/admin.ts` creates a service-role client and is intentionally restricted to server-side account administration flows.

## Data model overview

The generated database contract lives in `lib/types/database.ts`. The key entities are:

- `profiles`: application user profile, role, school membership, disabled and forced-password-change status.
- `schools`, `classes`, `subjects`, `terms`, and `grading_keys`: school and academic configuration.
- `students` and `enrollments`: student records and session-based class history.
- `teacher_assignments`: maps a teacher to a class and subject; `classes` also stores the designated class teacher.
- `scores`, `attendance`, and `report_comments`: the inputs rendered on report sheets.
- `guardians_students`: links parent accounts to children.

Passport image objects are stored in the Supabase `passports` storage bucket. Report pages generate short-lived signed URLs when displaying those images.

## UI structure

The root layout imports the global styles and declares metadata. Each dashboard layout provides the shared `DashboardHeader`, `DashboardNav`, and responsive content container. Navigation definitions are centralized in `components/dashboard/navLinks.ts` so label/href/icon changes stay consistent.

On screens below Tailwind’s `sm` breakpoint, `DashboardNav` shows a clear, touch-friendly disclosure menu. At `sm` and above it retains the existing always-visible horizontal navigation. Both views use exactly the same links and active-route logic.

## Common maintenance tasks

- Add a page: create the route folder and its `page.tsx`, then add or update a role layout only when the access boundary changes.
- Add a navigation destination: update `navLinks.ts`; do not rely on it as authorization.
- Add a database field: write a timestamped migration, apply it, then refresh `lib/types/database.ts` from Supabase before using the new type.
- Add a privileged operation: use a Server Action, call `requireRole`, validate all inputs, and use `createAdminClient` only if normal RLS-backed access is insufficient.
- Add a client interaction: place browser state and event handlers in a Client Component, keeping secret access and authorization server-side.

## Verification

Run the TypeScript check after code changes:

```bash
npx tsc --noEmit
```

Then run a production build when the environment variables and remote services are configured:

```bash
npm run build
```

The package’s current `lint` script requires maintenance because Next.js 16 no longer supports `next lint`; see the audit note in the repository README.
