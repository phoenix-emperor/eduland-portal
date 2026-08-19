# Eduland Portal

Eduland Portal is a role-based school reporting application. It gives school administrators tools to manage academic data and accounts, teachers tools to record scores and attendance, and parents a read-only view of their children’s reports.

The application is built with Next.js App Router, React, TypeScript, Tailwind CSS, and Supabase (Authentication, PostgreSQL, and Storage).

For the full architectural guide, route map, data-flow reference, and contributor notes, see [Codebase Guide](docs/CODEBASE_GUIDE.md).

## Run locally

1. Install Node.js and project dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` with the required values:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
   RESEND_API_KEY=your-resend-api-key
   RESEND_FROM_EMAIL=Eduland Portal <noreply@example.com>
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

   `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` are server secrets. Never expose them in browser code or commit `.env.local`.

3. Apply the SQL migrations in `supabase/migrations` to the target Supabase project, in filename/timestamp order.

4. Start the development server:

   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000`. The root route directs users to their authenticated dashboard or the login page.

## Available commands

```bash
npm run dev     # Development server
npm run build   # Production build and type validation
npm run start   # Serve a production build
```

> Note: the current `npm run lint` script calls the removed `next lint` command in Next.js 16. Run `npx tsc --noEmit` for TypeScript checking until the lint command is updated.

## Project layout

```text
app/                    Routes, route layouts, and server actions
components/             Shared dashboard, parent-report, and student UI
lib/                    Authentication, Supabase clients, types, and utilities
supabase/migrations/    Versioned PostgreSQL schema and policy changes
scripts/                One-off operational scripts (including demo accounts)
public/                 Static assets such as the school logo
docs/                   Maintainer documentation
proxy.ts                Session refresh and coarse route protection
```

## Guardrails

- Do not import `lib/supabase/admin.ts` from a Client Component. It uses the Supabase service-role key and bypasses Row Level Security.
- Keep role checks in server-side pages, layouts, and actions. The navigation is a convenience UI, not an authorization boundary.
- Update database types in `lib/types/database.ts` after schema changes.
- Treat migration files as append-only history once applied to a shared Supabase project.
