# Hostel Management System (HMS_2)

## Tech Stack
- Next.js 15 App Router, TypeScript, Prisma/PostgreSQL, NextAuth v5
- TanStack React Query, Tailwind CSS 4, Radix UI, Chart.js, date-fns
- Zod v4.4.3, React Hook Form
- Database: PostgreSQL (`postgresql://postgres:postgres@localhost:5432/hostel_management?schema=public`)

## Auth
- NextAuth v5 with JWT, role-based access (SUPER_ADMIN, HOSTEL_ADMIN, STAFF, STUDENT)
- Default: `admin@hostelms.com` / `Admin@123`

## Project Structure
- `src/app/api/**/route.ts` — API routes (REST)
- `src/lib/services/` — Business logic layer
- `src/lib/repositories/` — Prisma query layer
- `src/lib/validations/` — Zod schemas
- `prisma/seed.ts` — Seed data

## Key Issues Fixed

### Zod v4 Compatibility
- Zod v4.4.3 has different type inference than v3
- `z.coerce.number()` produces `ZodEffects` (infers as `unknown`) — breaks `react-hook-form`'s `zodResolver`
- **Fix**: Use plain `useState` forms instead of `react-hook-form` + `zodResolver` in new pages

### Filter Placeholder Bug (20+ files)
- Original: `<Select value=" ">` with space string — was broken
- **Fix**: Changed all to `<Select value="__all__">` with `onValueChange` handler converting `__all__` → `""`
- Fixed in: students, hostels, rooms, room-allocations, room-visualization (3 selects), reports, users

## Features Added

### Fee Management (Payments)
- **Page**: `src/app/admin/payments/page.tsx` — Full CRUD, stats cards, filters, pagination, CSV export
- **API**: `src/app/api/payments/route.ts` — POST/GET with Zod validation + notification creation

### Toast Notification System
- **Component**: `src/components/shared/toast.tsx` — ToastProvider, useToast hook, auto-dismiss
- **Integrated**: `src/app/providers.tsx` wraps with ToastProvider
- **Usage**: Allocation service creates notifications on room allocation

### Seed Data (`prisma/seed.ts`)
- Rewritten with: 50 students, 60 rooms (20 hostels), 20 complaints, 50+ payments, 27 visitors, 10 leave requests
- Realistic data: Indian/international names, multi-month staggered dates, linked notifications

### CSV Export
- Added to: payments, students, rooms pages with `FileSpreadsheet` button
- Generates proper CSV with escaped fields, date-stamped filenames

## Build Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build
npx tsc --noEmit     # TypeScript check (must pass before committing)
npx prisma db push   # Sync schema
npx prisma db seed   # Seed database
```

## Patterns to Follow
- Always create notifications (`notification.service`) when entities are created/updated
- Use `"__all__"` + converter for Select placeholders, never `" "`
- For new form pages: use plain `useState` (not react-hook-form with zodResolver) due to Zod v4
- Check `npx tsc --noEmit` before considering any task complete
