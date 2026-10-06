# BloomDesk Design System · Crayon Box (v4, Oct 2026)

Read this before building any BloomDesk UI. Live examples (see the Crayon Box section): https://claude.ai/artifact/FrHX9MJRGWGVQomf5DyvkY
All themes considered, for reference: https://claude.ai/artifact/S4ySLNpVef6TSkTgLrmbkF

BloomDesk is play school software for India: an **Owner/Admin web app**, a **Teacher mobile app** and a **Parent mobile app** on one backend. The theme is **Crayon Box**, a child's notebook: ruled lines, a red margin, crayon colours, doodled suns and stars, gold-star stickers. It should feel like a play school while staying **simple and easy on the eyes**.

Fonts: **Fredoka** for headings, **Nunito** for text, **Kalam** for one short handwritten note per screen.

Dark mode follows the phone or OS. To force it, set an attribute on `<html>`:

```html
<html data-theme="dark">   <!-- or "light"; leave it off to follow the OS -->
```

## Files in this folder

| File | Use |
| --- | --- |
| `tokens.css` | Source of truth. All `--bd-*` variables, light + dark. Import once at the app root. |
| `school-details.css` | Opt-in classes that add the notebook feel (header, hero panel, ruled paper, doodles, gold stars). Import after tokens.css. |
| `tailwind.config.js` | Tailwind v3 theme mapped to the variables (colours, `font-display`, `font-sans`, `font-hand`, radii, text sizes). |
| `tailwind-v4.css` | Same for Tailwind v4 (`@theme inline`). |
| `tokens.json` | Raw values for React Native / Flutter. |
| `archive/three-school-themes/` | Earlier version with Chalkboard and School Bus as switchable themes. Reference only. |
| `archive/calm-peacock/` | The first calm teal theme. Reference only. |

Fonts (Next.js: `next/font/google` with `Fredoka`, `Nunito`, `Kalam`, `Baloo_2`, `Mukta`):

```html
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;500;600;700&family=Kalam:wght@400;700&family=Baloo+2:wght@500;600&family=Mukta:wght@400;500;600&display=swap" rel="stylesheet">
```
Fredoka and Nunito have no Hindi letters, so the font stacks fall back to Baloo 2 (headings) and Mukta (text) for Devanagari. Kalam writes Hindi too.

## Hard rules

1. **Never hard-code a colour, font, radius or shadow in a component.** Use tokens (`var(--bd-primary)`, Tailwind `bg-primary`, `rounded-md`, `font-display`). Dark mode depends on it.
2. **The notebook feel goes in a few places only**: the app header (`.bd-header`), one hero panel per screen (`.bd-feature`), titles (`.bd-title`), empty states and small doodles. **Lists, tables, forms and settings stay plain**: white surfaces, hairline borders, body font. That keeps it easy on the eyes.
3. **`primary` (crayon blue) is for everything tappable** (buttons, links, active tab, focus ring). One filled primary button per view.
4. **`accent` (pencil yellow) is a fill, never text on white.** Use it for the Parent app's Pay button, the Late state, gold stars and highlights.
5. **Every status pairs a colour with an icon or letter**: Present ✓, Absent ✕, Late (clock), On leave (plane).
6. Text on a tint uses its `-ink` token (`success-soft` + `success-ink`). Text on a solid fill uses `on-primary`, `on-accent`, `on-success`, `on-danger`, `on-school-accent`.
7. **Dark mode is required.** The dark notebook keeps the same structure with softer colours. Never use pure black or pure white text.
8. **Touch targets** 44px, and 56px for teacher list rows.
9. Weights: body 400, emphasis 500, headings 600. Labels in sentence case, never ALL CAPS.
10. Use **Lucide** line icons (`lucide-react`, `lucide-react-native`), 1.75px stroke. No emoji as icons and no clip-art. Real photos of children carry the warmth.

## Tokens

- **Surfaces and text**: `bg`, `surface`, `surface-2`, `border`, `border-strong`, `ink`, `ink-2`, `ink-3`.
- **Brand**: `primary` crayon blue `#2E5FBF`, `primary-hover`, `primary-soft`, `on-primary`; `accent` pencil yellow `#FFC93C`, `accent-soft`, `accent-ink`, `on-accent`.
- **Header colour**: `school-accent` + `on-school-accent` (crayon blue + white by default). Each school can set its own brand colour here later; recompute `on-school-accent` for contrast.
- **Class crayons**: `class-playgroup` (red `#C8443A`), `class-nursery` (orange `#B05A0C`), `class-lkg` (green `#2F8547`), `class-ukg` (blue `#2E5FBF`). A fixed colour per class level, shown as a small crayon mark beside the class name.
- **Notebook details**: `ruled` (ruled lines), `margin` (red margin line), `deco-sun`, `deco-cloud`, `deco-star` (doodles and gold stars).
- **Fonts and radius**: `font-display` (Fredoka), `font-body` (Nunito), `font-hand` (Kalam); `radius-xs` 10, `radius-sm` 14, `radius-md` 16, `radius-lg` 24, `radius-pill`.
- **Status**: `success` (present, paid), `warning` (late, due soon), `danger` (absent, overdue), `info` (on leave), each with `-soft` and `-ink`; `on-success`, `on-danger`.
- **Other**: type sizes, spacing, shadows, `tap`, `tap-teacher`, motion, `focus`.

Contrast: every text pair passes WCAG AA (4.5:1) in light and dark.

## Type scale

| Token | Size/line | Font | Use |
| --- | --- | --- | --- |
| `display` | 40/44 · 600 | Fredoka | Parent greeting. One per screen. |
| `h1` | 30/38 · 600 | Fredoka | Page titles |
| `h2` | 22/28 · 600 | Fredoka | Section titles, Parent card titles |
| `h3` | 18/24 · 500 | Nunito | Card titles in Owner and Teacher |
| `body` | 16/26 · 400 | Nunito | Default on mobile |
| `body-sm` | 14/22 · 400 | Nunito | Owner tables, dense lists |
| `label` | 13/18 · 500 | Nunito | Field labels, table headers |
| `caption` | 12/16 · 500 | Nunito | Timestamps, helper text |

`font-hand` (Kalam) is for one short handwritten note per screen ("Have a lovely day at school!", "Thought for the day"), never for data. Money is ₹ with Indian grouping (`Intl.NumberFormat('en-IN', {style:'currency', currency:'INR', maximumFractionDigits:0})` → ₹1,42,500) and tabular numbers.

Spacing: 4px grid (`space-1`=4 … `space-16`=64). Card padding 20 mobile / 24 web, gaps 16 / 20–24.

## School details (school-details.css)

| Class | What it does |
| --- | --- |
| `.bd-header` | App header: crayon blue with doodles in the bottom-right corner. |
| `.bd-feature` | One hero panel per screen (owner greeting, empty state): a pale yellow card. |
| `.bd-title` | Page and screen titles get a wavy pencil-yellow underline. |
| `.bd-hand` | Short handwritten note in Kalam. |
| `.bd-paper` (+ `.bd-margin`) | Notebook ruled lines and red margin. Use on page backgrounds, not cards. |
| `.bd-stat` | Owner stat cards with a crayon stripe on top (set `--bd-stat-color`, e.g. `var(--bd-class-lkg)`). |
| `.bd-doodles` | Sun, cloud and stars SVG (markup below). |
| `.bd-present` | Present button; becomes a gold-star sticker when marked. |
| `.bd-tabbar`, `.bd-tab` | Bottom navigation; the active tab (`aria-current="page"`) gets a `primary-soft` pill behind its icon. |

Doodles SVG:

```html
<svg class="bd-doodles" viewBox="0 0 200 90" aria-hidden="true">
  <g class="sun"><circle cx="160" cy="30" r="13"/>
    <line x1="160" y1="7" x2="160" y2="12"/><line x1="160" y1="48" x2="160" y2="53"/>
    <line x1="137" y1="30" x2="142" y2="30"/><line x1="178" y1="30" x2="183" y2="30"/>
    <line x1="144" y1="14" x2="147.5" y2="17.5"/><line x1="172.5" y1="42.5" x2="176" y2="46"/>
    <line x1="176" y1="14" x2="172.5" y2="17.5"/><line x1="147.5" y1="42.5" x2="144" y2="46"/></g>
  <path class="cloud" d="M92 62h44a10 10 0 0 0 0-20 14 14 0 0 0-26-6 11 11 0 0 0-18 8 9 9 0 0 0 0 18z"/>
  <polygon class="star" points="40,6 43,13 50,13.7 44.6,18.4 46.2,25.4 40,21.7 33.8,25.4 35.4,18.4 30,13.7 37,13"/>
</svg>
```

## Components

**Button**: height 44 (34 in web toolbars), radius `sm`, body font 500 15px, icon + label with 8px gap. Primary `bg-primary text-on-primary`; Secondary `bg-surface text-ink border-border-strong`; Ghost `text-primary`, hover `bg-primary-soft`; Accent `bg-accent text-on-accent` (Parent main action only); Danger `bg-danger text-on-danger` behind a confirmation.

**Status pill**: height 26, radius pill, 500 13px, 14px icon, `-soft` bg + `-ink` text. Attendance: Present (success) · Absent (danger) · Late (warning) · On leave (info). Fees: Paid · Due {date} · Overdue · Waived (neutral). Admissions: Enquiry · Visit booked · Follow up · Admitted.

**Class crayon**: 18×8 crayon-tip shape in the class colour + class name, 500 13px.

**Text field**: label above, input 44 high, radius `xs`, `border-strong` border, `surface` bg. Errors in `danger` and written as a fix ("Enter a 10-digit mobile number."). `+91` prefix for phones, `₹` for money.

**Card**: Owner/Teacher `surface`, 1px `border`, radius `md`, little or no shadow. Parent: no border, radius `lg`, shadow `md`.

**Bottom sheet**: radius 24 top corners, grab handle, dimmed backdrop, `h2` title, accent main action, one line of reassurance below ("You'll get a receipt here and on WhatsApp.").

**Toast**: `bg-ink text-bg`, radius `sm`, shadow `lg`, optional Undo. **Empty state**: `.bd-feature` panel with a doodle, `h3` title, one sentence, primary + ghost action.

## Per-app layout

### Owner / Admin (web-first)
- Sidebar 220px: school logo tile (`primary-soft`), nav items 15px with icons, active = `primary-soft` bg + `primary` text, count badges neutral. A small row of crayons at the bottom.
- Main area on `.bd-paper.bd-margin`: greeting in `.bd-feature` with a `.bd-hand` note → 4 `.bd-stat` cards (Present, Fees collected, Overdue, Open enquiries) → "Needs your attention" list → tables.
- Tables stay plain: `body-sm`, rows 14×20 padding, hairline borders, numbers right-aligned.

### Teacher (mobile-first)
- `.bd-header` class bar: date caption, class name `h2` (`.bd-title`), class crayon.
- Attendance: summary (Present / Absent / Not marked), "Mark everyone present", then 56px rows with avatar, name, parent caption and P / A / L toggles (`.bd-present` on P). Floating "Submit attendance" button. Tab bar: Attendance, Post, Notes, Parents.
- Works offline; show a banner instead of blocking.

### Parent (mobile-first)
- `.bd-header` with school logo, school name, bell, greeting "Namaste, {name}" and a `.bd-hand` line ("Aarav is having a happy day"), plus doodles. Cards overlap the header by 40px.
- Cards (radius `lg`, shadow `md`): "{child} is in school" status → Today (photos + timeline) → Fee card (amount, due pill, accent "Pay"). Tab bar: Today, Journey, Fees, Notices.

### Screens to build first
- **Parent**: Sign in (+91 mobile field, "Send code", English/हिन्दी toggle), Today, Fees (summary, invoice list, payment bottom sheet with "Any UPI app" / "Show QR"), Notices.
- **Teacher**: Attendance, New post (photo picker grid, caption, children chips, "Share with parents").
- **Owner**: Today dashboard (greeting, 4 stat cards, Needs your attention, Recent payments).
- **Phone chrome**: respect safe areas; the tab bar adds `env(safe-area-inset-bottom)`; floating buttons sit 16px above the tab bar.

## Voice

Plain, warm, specific, the way a school owner talks ("fees", "register", "pickup", "class"). Buttons say exactly what happens ("Record payment", "Send reminder"). Errors say how to fix it.

## Prompt for Claude Code

> Use `theme/DESIGN.md` as the design system. Import `theme/tokens.css` and `theme/school-details.css` globally and use the Tailwind config in `theme/`. Never hard-code colours, fonts or radii. Build {screen} following the {Owner|Teacher|Parent} layout rules.
