@AGENTS.md

# BloomDesk

- Design system: `docs/design/DESIGN.md` (Crayon Box, the only theme). Never hard-code colours, fonts, radii or shadows; use the `--bd-*` tokens or the Tailwind names from `src/styles/tailwind-v4.css` (`bg-primary`, `text-ink-2`, `rounded-md`, `font-display`, `min-h-tap`). Dark mode depends on it.
- The notebook details (`.bd-feature`, `.bd-title`, `.bd-hand`, `.bd-paper`, `.bd-stat`, doodles) go in headers, hero panels and empty states only; tables, lists and forms stay plain.
- `school-details.css` is unlayered, so its rules beat Tailwind utilities on the same element (e.g. `.bd-tabbar` display vs `lg:hidden`). Put the utility on a wrapper.
- Database is PostgreSQL through Prisma 7 (`prisma/schema.prisma`, client generated to `src/generated/prisma`, imported as `@/generated/prisma/client`; use `db` from `@/lib/db`). Every school-owned table has `schoolId`. Change the schema, then `npm run db:migrate -- --name <change>`; add CHECK constraints by hand in the migration SQL. There is no RLS: school scoping happens in app code.
- Server Actions must call `requireSchool()` (or `requireUser()`) and take the school id from it, never from the browser. Scope every query with `schoolId: school.id`; for one record use `findFirst`/`updateMany`/`deleteMany` with `{ id, schoolId }`, not `update({ where: { id } })`. Run ids from URLs or forms through `isUuid()` first. Another school's record must behave as "not found".
- Sign-in is our own: bcrypt passwords, database sessions in the `bd_session` HTTP-only cookie (`src/lib/auth/`). Email goes through `sendEmail()` in `src/lib/email`; in development it prints to the dev server terminal.
- Tests run against the real database: `npm test` (needs `npm run db:start` and `npm run db:migrate`). Put school-scoped write logic in `src/lib/*.ts` so it can be tested without Next.js.
- Money is ₹ with `Intl.NumberFormat('en-IN', …)`; dates use the school's time zone (`todayISO(school.timezone)`).
