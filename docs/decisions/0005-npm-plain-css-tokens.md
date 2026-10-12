# 0005 · npm + plain CSS custom properties (no pnpm, no Tailwind yet)

**Status:** accepted · 2026-10-12

**Context.** The brief suggests pnpm and Tailwind. Neither was installed, and the style guide is already defined as CSS tokens.

**Decision.** The web app uses npm and a single `globals.css` that defines the style-guide tokens (light, dark, and the `data-theme` override) plus component classes. Components reference tokens only, and CI greps for raw hex colours outside `globals.css`.

**Consequences.** Fewer moving parts on Windows. Switching to pnpm is a lockfile change. A Tailwind preset can map to the same `var(--token)` names later without touching components.
