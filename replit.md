# Redirect Setup Integration

## Overview
A full-stack B2B survey panel management and routing system. Admins create projects (surveys), generate unique tracking URLs, distribute them to suppliers/respondents, and the system automatically routes each respondent to the correct survey vendor URL based on their response outcome.

## Tech Stack
- **Frontend**: React 18 + TypeScript, Wouter routing, TanStack React Query, Tailwind CSS, Shadcn UI components, Recharts
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL via Drizzle ORM
- **Auth**: bcryptjs password hashing, express-session with connect-pg-simple
- **Export**: ExcelJS for .xlsx response exports

## Architecture
```
client/src/
├── components/
│   ├── ui/                    # Shadcn UI components
│   ├── admin-layout.tsx       # Admin layout wrapper with sidebar
│   ├── app-sidebar.tsx        # Navigation sidebar
│   ├── copy-button.tsx        # Clipboard copy with feedback
│   ├── landing-result-layout.tsx  # Full-screen result pages layout
│   ├── stat-card.tsx          # Dashboard stat card
│   └── status-badge.tsx       # Colored status pill badges
├── pages/
│   ├── admin/
│   │   ├── dashboard.tsx      # Stats, traffic chart, live feed
│   │   ├── projects.tsx       # Project list with cards
│   │   ├── project-form.tsx   # Create/edit project form
│   │   ├── responses.tsx      # Paginated response table
│   │   ├── clients.tsx        # Client CRUD
│   │   ├── suppliers.tsx      # Supplier management
│   │   ├── redirects.tsx      # Redirect URL grid
│   │   └── settings.tsx       # Password change, bulk delete
│   ├── login.tsx              # Admin login
│   ├── complete.tsx           # Success landing page
│   ├── terminate.tsx          # Terminate landing page
│   ├── quotafull.tsx          # Quota full landing page
│   ├── security-terminate.tsx # Security terminate page
│   ├── duplicate-ip.tsx       # Duplicate IP page
│   ├── duplicate-string.tsx   # Duplicate UID page
│   └── paused.tsx             # Paused survey page
server/
├── index.ts                   # Express app setup
├── auth.ts                    # Session auth middleware
├── db.ts                      # Drizzle database connection
├── routes.ts                  # All API + routing endpoints
├── storage.ts                 # Database storage layer (IStorage)
├── static.ts                  # Static file serving (production)
└── vite.ts                    # Vite dev server setup
shared/
└── schema.ts                  # Drizzle schema: admins, clients, projects, suppliers, responses
```

## Database Tables
- **admins**: Admin users with bcrypt-hashed passwords
- **clients**: Companies/contacts who commission surveys
- **projects**: Survey projects with PID, redirect URLs, parameters
- **suppliers**: Per-project suppliers with their own redirect URLs
- **responses**: Respondent tracking with status, session, IP

## Key Features
- **Survey Routing**: GET /r/:pid entry point → duplicate detection → session creation → redirect to survey
- **Callback Tracking**: /track/complete, /track/terminate, /track/quotafull, /track/security-terminate
- **Admin Dashboard**: Real-time stats, traffic chart, live activity feed
- **Project Management**: Full CRUD with inline supplier management
- **Response Export**: Excel export with filters
- **Landing Pages**: Themed full-screen result pages with glassmorphic response record table

## Default Admin
- Username: `admin`
- Password: `admin123`

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption secret
