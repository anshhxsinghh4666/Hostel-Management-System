# Hostel Management System

A comprehensive, production-grade Hostel Management System built with Next.js 15, TypeScript, PostgreSQL, and Tailwind CSS.

## Features

### Core Modules
- **Authentication & Authorization** - Login, registration, password reset, role-based access (Super Admin, Hostel Admin, Staff, Student)
- **Student Management** - CRUD operations, search, filter, pagination, profile management
- **Room Management** - Room CRUD, hostel management, room visualization, allocation, transfers, vacating
- **Complaints Management** - Register, update status, resolve with remarks, category & priority tracking
- **Leave Management** - Apply, approve/reject with comments, status tracking
- **Fee Management** - Payment records, status tracking, payment history with multiple payment methods
- **Visitor Management** - Visitor requests, gate passes with QR codes, check-in/out logs, stay extensions
- **Notifications** - Real-time notification bell, mark read, unread count
- **Reports & Analytics** - PDF/Excel export for occupancy, students, complaints, payments, visitors, leaves
- **Audit Logging** - Comprehensive action tracking for all operations
- **Dashboard** - KPI cards, charts (Chart.js), recent activity, pending actions

### Technical Features
- Next.js 15 App Router with TypeScript
- PostgreSQL with Prisma ORM
- NextAuth v5 (JWT session strategy)
- Role-based access control (RBAC)
- Responsive design with mobile sidebar
- Dark mode support
- Zod validation on all forms
- TanStack Query for data fetching
- Centralized error handling
- Input sanitization & SQL injection prevention via Prisma
- Secure password hashing (bcryptjs)
- Rate limiting on auth endpoints

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS 4 |
| **UI Components** | ShadCN UI (Radix primitives) |
| **Database** | PostgreSQL |
| **ORM** | Prisma |
| **Auth** | NextAuth v5 (Credentials, JWT) |
| **Forms** | React Hook Form + Zod |
| **Data Fetching** | TanStack Query |
| **Charts** | Chart.js + react-chartjs-2 |
| **PDF Export** | jsPDF + jspdf-autotable |
| **Excel Export** | xlsx + file-saver |
| **QR Codes** | qrcode |
| **Icons** | lucide-react |

## Prerequisites

- Node.js 18+
- PostgreSQL running locally
- npm

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd hostel-management-system
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Update the values in `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hostel_management?schema=public"
AUTH_SECRET="your-super-secret-key-at-least-32-chars-long"
AUTH_URL="http://localhost:3000"
JWT_SECRET="your-jwt-secret-at-least-32-chars-long"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Set up the database

```bash
# Create the database
createdb hostel_management

# Run migrations
npx prisma migrate dev --name init
```

### 5. Seed the database

```bash
npx prisma db seed
```

### 6. Start the development server

```bash
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000)

## Seeded Accounts

| Role | Email | Password |
|------|-------|----------|
| **Super Admin** | admin@hostelms.com | Admin@123 |
| **Hostel Admin** | alice@hostelms.com | Admin@123 |
| **Hostel Admin** | bob@hostelms.com | Admin@123 |
| **Staff** | charlie@hostelms.com | Staff@123 |
| **Staff** | diana@hostelms.com | Staff@123 |
| **Staff** | eve@hostelms.com | Staff@123 |
| **Student** | frank@hostelms.com | Student@123 |
| **Student** | grace@hostelms.com | Student@123 |
| **Student** | henry@hostelms.com | Student@123 |
| **Student** | ivy@hostelms.com | Student@123 |
| **Student** | jack@hostelms.com | Student@123 |
| **Student** | kevin@hostelms.com | Student@123 |
| **Student** | lisa@hostelms.com | Student@123 |
| **Student** | mike@hostelms.com | Student@123 |
| **Student** | nina@hostelms.com | Student@123 |

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Auth pages (login, register, forgot/reset password)
│   ├── admin/               # Admin pages (dashboard, students, hostels, rooms, complaints, etc.)
│   ├── api/                 # API route handlers
│   │   ├── auth/            # Authentication endpoints
│   │   ├── admin/           # Admin CRUD endpoints
│   │   ├── dashboard/       # Dashboard data endpoints
│   │   ├── student/         # Student endpoints
│   │   ├── notifications/   # Notification endpoints
│   │   ├── reports/         # Report generation endpoints
│   │   └── ...
│   ├── student/             # Student pages
│   ├── staff/               # Staff pages
│   ├── hostel-admin/        # Hostel admin pages
│   ├── audit-logs/          # Audit log viewer
│   ├── globals.css          # Global styles
│   └── layout.tsx           # Root layout
├── components/
│   ├── ui/                  # ShadCN UI primitives
│   ├── forms/               # Auth forms (login, register, etc.)
│   ├── layout/              # Dashboard layout, sidebar, navbar
│   └── shared/              # Shared components (loading, empty state, etc.)
├── lib/
│   ├── auth/                # NextAuth configuration
│   ├── db/                  # Prisma client
│   ├── services/            # Business logic layer
│   ├── repositories/        # Data access layer
│   ├── permissions/         # RBAC utilities
│   ├── validations/         # Zod schemas
│   ├── utils/               # Utilities (API response, error handler, etc.)
│   ├── constants/           # Constants
│   └── types/               # TypeScript types
├── middleware.ts            # Route protection via NextAuth
└── types/                   # NextAuth type augmentation
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Lint code |
| `npm run typecheck` | TypeScript type checking |
| `npm test` | Run tests |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Open Prisma Studio |

## Deployment

### Build for production

```bash
npm run build
npm start
```

### Environment variables for production

Ensure all environment variables are set in your production environment:

- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - NextAuth secret (generate with `openssl rand -base64 32`)
- `AUTH_URL` - Deployment URL
- `JWT_SECRET` - JWT signing secret
- `NEXT_PUBLIC_APP_URL` - Public deployment URL

### Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate && npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Security

- **SQL Injection**: Prevented by Prisma ORM parameterized queries
- **XSS**: React's built-in escaping + Content Security Policy
- **CSRF**: SameSite cookies + token validation
- **Authentication**: JWT with httpOnly cookies, secure in production
- **Password**: bcryptjs hashing (12 rounds)
- **Rate Limiting**: In-memory rate limiter on auth endpoints
- **Input Validation**: Zod schemas on all API inputs
- **Session**: 30-day JWT expiry, secure cookie configuration

## License

MIT
