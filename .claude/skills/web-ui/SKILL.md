---
name: web-ui
description: Build or change pages and components in apps/web (Next.js 15, React 19, plain CSS tokens) following the style guide, English/Hebrew i18n with RTL, project-scoped paths and mobile layout. Use for any UI, page, component, chart, styling, copy, translation, theme or layout change in apps/web, including the personal page.
---

# Web UI

Stack: Next.js 15 App Router, React 19, TypeScript, npm, `recharts`, `react-leaflet`, `lucide-react` icons. No Tailwind: all styling is classes in `app/globals.css` backed by tokens ([ADR 0005](../../../docs/decisions/0005-npm-plain-css-tokens.md)).

## Before writing UI
Read the relevant section of `docs/style-guide.md`: §3 colour tokens, §4 type, §5 space/shape/layout, §6 components, §7 data viz, §9 accessibility, §10 voice. Reuse existing classes and components (`components/Shell.tsx`, `AnswerCard`, `Chart`, `Lineage`, `MapView`) before adding new ones.

## Rules
- **Colours:** `var(--token)` only. A raw `#RRGGBB` anywhere outside `globals.css` fails CI. New token → add it to light, `prefers-color-scheme: dark` (`:root:not([data-theme="light"])`) and `:root[data-theme="dark"]`.
- **Meaning of colour:** blue (`--link`) = interactive; orange (`--accent`) = brand / one primary action; green/amber/red = status only, never a data series. Trust tier badges per style guide §3.3.
- **i18n:** every visible string is a key in `lib/i18n.tsx` `STRINGS` with both `en` and `he`; read it via `const { t, lang } = useI18n()`. Don't inline English.
- **RTL:** Hebrew sets `dir="rtl"` on `<html>`. Use logical CSS (`margin-inline-start`, `padding-inline`, `inset-inline-end`, `text-align: start`), never left/right. Code blocks, SQL, charts and maps stay LTR (`dir="ltr"`).
- **Paths:** links inside Campo go through `demoPath("/x")` from `lib/paths.ts`. API calls go through `lib/api.ts` (`/api/pipeline/*` rewrite), never a hard-coded pipeline URL.
- **Mobile:** must work at 360px wide with no horizontal scroll; check the top bar, tables and charts.
- **Accessibility:** visible `:focus-visible` ring, status always icon + word, tabular numbers in tables.
- Leaflet components need `"use client"` and dynamic import without SSR (see `MapView`).

## Check
```
cd apps/web && npm run typecheck && npm run build
```
Then look at it: `python tasks.py dev` → http://localhost:3000/projects/campo-analytics in light, dark, `?lang=he`, and a phone width. Say plainly if you couldn't visually check it.
