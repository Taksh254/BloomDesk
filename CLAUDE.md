@AGENTS.md

# BloomDesk

- Design system: `docs/design/DESIGN.md` (Crayon Box, the only theme). Never hard-code colours, fonts, radii or shadows; use the `--bd-*` tokens or the Tailwind names from `src/styles/tailwind-v4.css` (`bg-primary`, `text-ink-2`, `rounded-md`, `font-display`, `min-h-tap`). Dark mode depends on it.
- The notebook details (`.bd-feature`, `.bd-title`, `.bd-hand`, `.bd-paper`, `.bd-stat`, doodles) go in headers, hero panels and empty states only; tables, lists and forms stay plain.
- `school-details.css` is unlayered, so its rules beat Tailwind utilities on the same element (e.g. `.bd-tabbar` display vs `lg:hidden`). Put the utility on a wrapper.
- Every table has `school_id` and RLS. Add new tables in a new file under `supabase/migrations/` with policies using `is_school_staff()` / `is_school_admin()`.
- Server Actions must call `requireSchool()` and scope writes with `.eq("school_id", school.id)`; RLS is the backstop, not the only check.
- Money is ₹ with `Intl.NumberFormat('en-IN', …)`; dates use the school's time zone (`todayISO(school.timezone)`).
