# BloomDesk

Simple software for play schools, preschools and daycares in India. One backend, three apps: **Owner** (web), **Teacher** and **Parent** (mobile). This repo starts with the Owner web app.

## Screenshots

| Today | Attendance | Phone, dark mode |
| --- | --- | --- |
| ![Today dashboard](docs/screenshots/today.png) | ![Attendance](docs/screenshots/attendance.png) | ![Today on a phone in dark mode](docs/screenshots/today-phone-dark.png) |

## What works today

- **Set up a school**: sign up with email and password, name your school, and get Playgroup, Nursery, LKG and UKG classes added for you.
- **Sign-in**: log in and out, forgot password (emailed reset link), confirm your email, with rate limits on login and reset.
- **Today**: greeting, who is present / absent / on leave / not marked, classes that still need attendance, and a per-class summary.
- **Children**: add, edit, search and filter by class; parent name and +91 mobile; mark a child as left or re-admit them; last 30 days of attendance.
- **Classes**: add, rename, set level and seats, delete.
- **Attendance**: pick a class and day, mark Present / Absent / Late / On leave, "Mark everyone present", save.

Coming next (from the product plan): roles and staff invites, hosting, fees, admissions, Excel import, announcements, then the Teacher and Parent apps.

## Stack

- Next.js 16 (App Router, Server Actions) + React 19 + TypeScript
- Tailwind CSS v4 with the **Crayon Box** theme (`src/styles/`, rules in `docs/design/DESIGN.md`)
- PostgreSQL with Prisma 7, and our own sign-in (bcrypt passwords, database sessions)

## Run it locally

You need Node 20+ and either PostgreSQL 15+ or Docker/Podman.

```bash
npm install
cp .env.example .env
npm run db:start     # a private PostgreSQL in ./.postgres on port 54329 (or a container)
npm run db:migrate   # create the tables
npm run db:seed      # a demo school with 30 children and two weeks of attendance
npm run dev
```

Open http://localhost:3000 and sign in as **demo@bloomdesk.in** (owner) or **teacher@bloomdesk.in** (teacher), password **bloomdesk123**, or sign up a new school.

Emails (confirm your email, reset password) are printed in the `npm run dev` terminal, links included.

Already have PostgreSQL somewhere? Skip `db:start` and set `DATABASE_URL` in `.env`. `npm run db:stop` stops the local database; `npm run db:reset` wipes it, re-runs the migrations and the seed.

### Checks

```bash
npm run lint
npm run typecheck
npm test        # runs against the database in DATABASE_URL; tests clean up after themselves
npm run build
```

## How data is kept apart

Every school-owned table carries a `school_id`. Pages and Server Actions get the school from the signed-in session (`requireSchool()`), never from the browser, and every query in `src/lib` filters by it, so another school's child, class or attendance is simply "not found". Owners and admins manage classes and children; teachers can read them and mark attendance. Attendance can only be saved for active children of that class, and its foreign key ties each mark to a child of the same school. `tests/school-scoping.test.ts` checks this with two schools side by side.

Sessions are random tokens in an HTTP-only cookie; the database stores only their SHA-256 hash, as it does for email links. Passwords are bcrypt hashes and are never logged.

## Project layout

```
prisma/               schema, migrations and the demo seed
scripts/dev-db.sh     local PostgreSQL for development
src/app/(auth)        sign in, sign up, forgot / reset password, confirm email
src/app/onboarding    create a school for an account that has none
src/app/(app)         the Owner app: today, attendance, children, classes
src/components/ui     buttons, fields, pills, class crayons, doodles
src/lib               database client, session, data access and writes, formatting
src/lib/auth          passwords, sessions, email tokens, rate limits
src/lib/email         email adapter (prints to the console in development)
src/styles            Crayon Box tokens (copied from the design hand-off)
tests                 tests that run against PostgreSQL
docs/design           design system rules (DESIGN.md) and raw tokens
```
