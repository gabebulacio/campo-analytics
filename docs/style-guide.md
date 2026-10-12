# Style guide

Visual source of truth for the app. Phase 0 turns §3–§6 into design tokens (CSS custom properties + a Tailwind theme). **Components never hardcode a colour, size or font**; they reference a token.

**Lineage.** The style descends from the *Measure Map* reference page built for the portfolio Power BI model: token-driven light/dark themes, eyebrow labels, layer badges, syntax-highlighted code, dependency trees and rule ladders. This version modernises it toward the look of developer-infrastructure dashboards such as Cloudflare's: neutral, flat, dense, hairline borders, one warm brand accent, and blue reserved for interaction.

> It borrows an *aesthetic*, not a brand. No third-party logo, name, wordmark or exact brand colour is used. The accent is a generic orange (`#EA580C`), not Cloudflare's.

---

## 1. Principles

1. **Data first, chrome last.** Surfaces are neutral; colour is spent on data, status and the one primary action per view.
2. **Flat and precise.** 1px hairlines instead of shadows; small radii; a strict 4px grid.
3. **Dense but calm.** Tables and panels are compact (Cloudflare-dashboard density); whitespace separates *sections*, not rows.
4. **Trust is visible.** Every answer shows its trust tier and a path to "¿Cómo se calculó?". Lineage UI is first-class, not a footnote.
5. **Fail loudly, kindly.** Warnings and refusals are designed states with plain language, never a blank chart.
6. **Same meaning, same colour.** Blue = interactive. Orange = brand / primary action. Green/amber/red = status only. Series colours never double as status.

---

## 2. Brand

| Element | Rule |
|---|---|
| Product name | Placeholder `Campo Analytics` until you choose one. Set in the UI sans, weight 650, letter-spacing −0.02em. |
| Mark | A 20×20 rounded square (`radius-sm`) filled `--accent`, with a simple glyph (leaf or grid) in `--accent-ink`. No illustrations. |
| Accent use | Primary button, active nav indicator, focus of the ask box, brand mark, at most one highlight per screen. Never for body text on white (3.56:1); use `--accent-strong` when orange must be text. |
| Data label | Footer on every page: "Capas públicas de referencia + datos sintéticos de productores" / "Public reference layers + synthetic producer data". |

---

## 3. Colour tokens

All pairs below were contrast-checked (WCAG 2.x). Ratios are against `--surface`.

### 3.1 Neutrals and UI

| Token | Light | Dark | Use | Contrast (L / D) |
|---|---|---|---|---|
| `--bg` | `#F7F7F8` | `#111112` | Page plane | — |
| `--surface` | `#FFFFFF` | `#1B1B1B` | Panels, cards, tables, chart surface | — |
| `--surface-2` | `#F2F3F5` | `#232325` | Hover rows, code blocks, table headers | — |
| `--surface-3` | `#E9EBEE` | `#2C2C2F` | Pressed, selected rows, skeletons | — |
| `--line` | `#E4E6EA` | `#2E2F33` | Hairline borders, dividers | — |
| `--line-strong` | `#CDD1D7` | `#3D3F44` | Input borders, axis baseline | — |
| `--ink` | `#111214` | `#EDEEF0` | Primary text, numbers | 18.7 / 14.8 |
| `--ink-2` | `#52555C` | `#A3A7AF` | Secondary text, labels | 7.5 / 7.1 |
| `--ink-3` | `#7A7E87` | `#7D828B` | Placeholders, axis ticks, meta. **Not for essential text** | 4.1 / 4.5 |
| `--accent` | `#EA580C` | `#FB923C` | Brand fills (see §2) | — |
| `--accent-strong` | `#C2410C` | `#FB923C` | Primary button bg (light), orange text | 5.2 / 8.3 |
| `--accent-ink` | `#FFFFFF` | `#111214` | Text on accent fills | 5.2 / 8.3 |
| `--accent-soft` | `#FFF1E8` | `#2B1A0F` | Accent tint backgrounds | — |
| `--link` | `#0B5CD5` | `#6EA8FE` | Links, interactive text, focus ring, selected tab | 6.0 / 7.1 |
| `--link-soft` | `#EAF2FF` | `#14233B` | Selected chip/row background | — |

### 3.2 Status (reserved: never a data series)

Always paired with an icon and a word.

| Token | Light text / soft bg | Dark text / soft bg | Meaning |
|---|---|---|---|
| `--ok` / `--ok-soft` | `#1A7F37` / `#E7F5EC` | `#4ADE80` / `#11281A` | Pass, verified, on track |
| `--warn` / `--warn-soft` | `#9A5B00` / `#FFF4DB` | `#FBBF24` / `#2D2410` | Warning, exploratory, near limit |
| `--bad` / `--bad-soft` | `#C62828` / `#FDECEC` | `#F87171` / `#2E1414` | Error, failed check, non-compliant |
| `--info` / `--info-soft` | `#5B3FC4` / `#F0ECFB` | `#A78BFA` / `#211B36` | Neutral notes, "governed" |

### 3.3 Answer trust tiers

The badge sits top-left of every answer card, before the title.

| Tier | Label (es / en) | Colours | Icon |
|---|---|---|---|
| VERIFIED | Verificado / Verified | `--ok` on `--ok-soft` | shield-check |
| GOVERNED | Basado en métricas definidas / Governed metrics | `--info` on `--info-soft` | layers |
| EXPLORATORY | Exploratorio — revisar / Exploratory — review | `--warn` on `--warn-soft`; SQL panel opens expanded | flask |
| NOT ANSWERED | Sin respuesta / Not answered | `--ink-2` on `--surface-2` | circle-slash |

### 3.4 Code and SQL highlighting

Carried over from the Measure Map and re-tuned for the new neutrals.

| Token | Light | Dark | Applies to |
|---|---|---|---|
| `--code-bg` | `#F6F7F9` | `#151516` | Code block background |
| `--k-kw` | `#A0226B` | `#F08BC4` | `SELECT`, `FROM`, `VAR`, `RETURN` |
| `--k-fn` | `#0B5CD5` | `#7FB5F0` | Functions |
| `--k-str` | `#1A7F37` | `#7FD49A` | Strings |
| `--k-num` | `#C62828` | `#F59990` | Numbers |
| `--k-col` | `#5B3FC4` | `#B9A5F0` | Tables and columns |
| `--k-ref` | `#9A5B00` | `#EDB36A` | Metric / measure references |
| `--k-cm` | `#7A7E87` | `#7D828B` | Comments |

### 3.5 CSS shape

```css
:root { color-scheme: light; --bg:#F7F7F8; --surface:#FFFFFF; /* …all light tokens */ }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { color-scheme: dark; --bg:#111112; --surface:#1B1B1B; /* … */ }
}
:root[data-theme="dark"] { color-scheme: dark; --bg:#111112; --surface:#1B1B1B; /* … */ }
```

Dark mode is a set of chosen values, not an automatic inversion. The theme toggle (system / light / dark) lives in the top bar.

---

## 4. Typography

| Role | Family | Fallback |
|---|---|---|
| UI and display | **Inter** (variable, opsz) | `system-ui, -apple-system, "Segoe UI", sans-serif` |
| Code, SQL, IDs | **JetBrains Mono** | `ui-monospace, Consolas, monospace` |

The Measure Map used three families (Archivo condensed display, Source Sans body, JetBrains Mono). The modern version drops to **one sans plus one mono**: hierarchy comes from size and weight, not a second display face.

| Token | Size / line height | Weight | Tracking | Use |
|---|---|---|---|---|
| `--t-display` | 36 / 40 | 650 | −0.025em | Landing hero only |
| `--t-h1` | 28 / 34 | 650 | −0.02em | Page title |
| `--t-h2` | 20 / 28 | 600 | −0.015em | Section, answer title |
| `--t-h3` | 16 / 24 | 600 | −0.01em | Panel title |
| `--t-body` | 14 / 22 | 400 | 0 | Default UI text (dashboard density) |
| `--t-body-lg` | 16 / 26 | 400 | 0 | Answer summary, landing copy |
| `--t-small` | 13 / 20 | 400 | 0 | Table cells, meta |
| `--t-eyebrow` | 11 / 16 | 600 | +0.08em, uppercase | Section labels (kept from Measure Map) |
| `--t-kpi` | 32 / 36 | 650 | −0.02em | KPI tile value |
| `--t-mono` | 12.5 / 20 | 400 | 0 | Code blocks, IDs, SQL |

- Numbers in tables and on axes use `font-variant-numeric: tabular-nums`. KPI and hero numbers keep proportional figures.
- Headings use `text-wrap: balance`; paragraphs are capped at 70ch.
- Load the fonts self-hosted through `next/font`, not a runtime CDN.

---

## 5. Space, shape, elevation, layout

| Token | Values |
|---|---|
| Spacing (4px grid) | `--s-1` 4 · `--s-2` 8 · `--s-3` 12 · `--s-4` 16 · `--s-5` 20 · `--s-6` 24 · `--s-8` 32 · `--s-10` 40 · `--s-12` 48 · `--s-16` 64 |
| Radius | `--r-xs` 4 (chips, badges) · `--r-sm` 6 (buttons, inputs) · `--r-md` 8 (cards, panels) · `--r-lg` 12 (modals, ask box) · `--r-full` 999 |
| Border | 1px `--line` everywhere; 1px `--line-strong` on inputs |
| Elevation | `--e-0` none (default) · `--e-1` `0 1px 2px rgb(0 0 0 / .05)` (hover cards) · `--e-2` `0 8px 24px rgb(0 0 0 / .12)` (menus, popovers, modals only) |
| Focus | 2px `--link` outline, 2px offset, on `:focus-visible` only |

**App shell (Cloudflare-dashboard pattern)**

```
┌───────────────────────────────────────────────────────────────┐
│ ■ Campo Analytics   [workspace ▾]      ⌘K Search   ES|EN  ◐  │  top bar 56px, --surface, bottom hairline
├──────────┬────────────────────────────────────────────────────┤
│ Preguntar│  Eyebrow · WORKSPACE                                │
│ Tableros │  H1 Page title                       [secondary][Primary]
│ Métricas │  ───────────────────────────────────────────────── │
│ Evals    │  content: max-width 1280, gutter 24 (16 on mobile)  │
│ Trazas   │                                                     │
│ sidebar  │                                                     │
│ 240px    │                                                     │
└──────────┴────────────────────────────────────────────────────┘
```

- Sidebar: 240px, `--bg`, items 32px tall. Active item: `--surface-3` background plus a 2px `--accent` bar on the left. Collapses to icons at < 1024px and to a sheet at < 768px.
- Breakpoints: `sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280. No horizontal page scroll at 360px; wide tables scroll inside their panel.
- Dashboard grid: 12 columns, 16px gap. KPI tiles span 3, charts 6 or 12.

---

## 6. Components

| Component | Spec |
|---|---|
| **Button: primary** | 32px tall (36 on touch), `--r-sm`, `--accent-strong` bg, `--accent-ink` text, weight 600. One per view. |
| **Button: secondary** | `--surface` bg, 1px `--line-strong`, `--ink` text; hover `--surface-2`. |
| **Button: ghost / link** | No border, `--link` text; hover underline. |
| **Ask box** (hero input) | 56px min height, `--r-lg`, 1px `--line-strong`, `--e-1`. On focus: 1px `--accent` border plus a 3px `--accent-soft` ring. Submit is a primary icon button inside it. Suggested questions sit below as chips. |
| **Input / select** | 32px, `--r-sm`, 1px `--line-strong`; focus uses the `--link` ring. Labels go above, never placeholder-only. |
| **Chip** | 24px, `--r-full`, 1px `--line`, `--t-small`. Clickable chips (suggestions, closest metrics, clarification options) go `--link` border and text on hover. Selected: `--link-soft` bg. |
| **Badge** | 20px, `--r-xs`, `--t-eyebrow` size without the uppercase tracking, soft bg plus strong text (see §3.2–3.3). |
| **Card / panel** | `--surface`, 1px `--line`, `--r-md`, padding `--s-5`. Header row: `--t-h3` title, optional eyebrow above, actions right-aligned. |
| **KPI tile** | Eyebrow label → `--t-kpi` value → `--t-small` `--ink-2` caption (e.g. "64% de la superficie verificada"). Optional delta with an arrow icon and a status colour. No sparkline unless a time grain exists. |
| **Table** | Header row `--surface-2`, `--t-eyebrow`, sticky. Rows 40px, hairline separators, hover `--surface-2`. Numbers right-aligned and tabular. No zebra stripes. Wide tables scroll inside the panel. |
| **Tabs** | Underline style: 2px `--link` under the active tab, `--ink-2` inactive. |
| **Code / SQL block** | `--code-bg`, 1px `--line`, `--r-md`, `--t-mono`. Toolbar with **Copiar** / **Ajustar líneas** (copy / wrap) carried over from the Measure Map. |
| **"¿Cómo se calculó?" panel** | Right-side drawer (480px; full-screen on mobile) with tabs: *Definición* · *Filtros* · *SQL* · *Fuentes* · *Filas de muestra*. Footer meta in `--ink-3` mono: `as_of`, semantic-layer SHA, trace ID, verified-query ID. |
| **Dependency tree** | From the Measure Map: mono 12.5px, hairline connectors, a coloured dot per layer, clickable names, "(expanded above)" for repeats, leaf shows `← source_table`. |
| **Rule ladder** | From the Measure Map: one row per rule, top to bottom, first match wins, outcome pill right-aligned in status colours. Use it to explain classifications such as LUC status and compliance status. |
| **Callout / warning** | Left 3px bar in the status colour, soft bg, icon, bold one-line title, then body. Result-check warnings stack under the answer title; they are never hidden. |
| **Empty state** | Icon (24px, `--ink-3`), one-line title, one sentence, one action. E.g. "Sin resultados para estos filtros · Probá ampliar el período". |
| **Skeleton** | `--surface-3` blocks with a 1.2s shimmer (none under reduced motion). Show the answer stages as they complete ("Interpretando → Planificando → Consultando"). |
| **Toast** | Bottom-right, `--surface`, `--e-2`, auto-dismiss after 5s. Errors stay until dismissed. |
| **Command palette** | ⌘K / Ctrl+K: search metrics, dashboards and past questions. |

Icons: **Lucide**, 16px in UI and 20px in empty states, 1.5px stroke, `currentColor`.

---

## 7. Data visualisation

Recharts by default; Plotly only for maps. Every chart gets its colours from the tokens below through the chart registry, never inline.

### 7.1 Categorical (fixed order, never cycled)

Validated with the six-check palette validator: lightness band, chroma, adjacent-pair CVD ΔE ≥ 8, normal-vision ΔE ≥ 15. Light on `#FFFFFF`: worst CVD 9.1, normal 19.6. Dark on `#1B1B1B`: worst CVD 8.4, normal 19.3, all ≥ 3:1.

| Slot | Light | Dark |
|---|---|---|
| `--series-1` blue | `#2A78D6` | `#3987E5` |
| `--series-2` orange | `#EB6834` | `#D95926` |
| `--series-3` aqua | `#1BAF7A` | `#199E70` |
| `--series-4` yellow | `#EDA100` | `#C98500` |
| `--series-5` magenta | `#E87BA4` | `#D55181` |
| `--series-6` green | `#008300` | `#008300` |
| `--series-7` violet | `#4A3AA7` | `#9085E9` |
| `--series-8` red | `#E34948` | `#E66767` |

- In light mode, aqua, yellow and magenta sit below 3:1 on white. Charts using them must show direct labels or offer the table view (every chart has a **Ver tabla** toggle anyway).
- Scatter plots, maps and small multiples: max **3** series. Past 8 series (or 3 for those forms), fold the rest into "Otros".
- Colour follows the entity, not its rank. A filter must not repaint surviving series.

### 7.2 Sequential, diverging, maps

- **Sequential** (heatmaps, choropleths): blue ramp `#CDE2FB → #86B6EF → #3987E5 → #256ABF → #0D366B`. This replaces the Measure Map's square-root white→blue heatmap, but keeps its "light = little" logic. Cell text flips to white above the midpoint.
- **Diverging** (vs plan, vs official yield): blue ↔ red with a grey midpoint (`#F0EFEC` light, `#383835` dark). Never a hue at zero.
- **Compliance maps**: polygons use the status tokens with a 1px `--surface` stroke. Basemap is greyscale (light/dark matched). Legend always visible.

### 7.3 Marks and chrome

- Lines 2px; markers ≥ 8px, shown on hover or for the last point only.
- Bars: 4px rounded data end, square at the baseline. 2px `--surface` gap between adjacent bars and stacked segments.
- Gridlines: horizontal only, 1px `--line`. Baseline 1px `--line-strong`. Axis text `--t-small`, `--ink-3`, tabular.
- **One y-axis, always.** Two measures of different scale go in two charts.
- Legend for 2 or more series, top-left above the plot. With 4 or fewer series, also label line ends directly. Text stays in ink tokens, never series colours.
- Hover: crosshair plus tooltip on line/area, per-mark tooltip on bars and cells. Tooltip is `--surface`, `--e-2`, `--r-sm`, values tabular.
- Chart selection rules (from README pipeline step 9): 1 metric, no dims → KPI tile · + time → line · + 1 category → horizontal bar sorted descending · + geo → map · > 25 rows or > 2 dims → table.

---

## 8. Motion

- Durations: 120ms (hover, press) · 200ms (drawers, tabs) · 300ms (chart enter). Easing `cubic-bezier(.2,.8,.2,1)`.
- Charts fade and grow from the baseline once on first render, not on every filter change.
- `prefers-reduced-motion: reduce` → all transitions are off and skeletons are static.
- Jump-to highlight: a 4px left inset bar in `--link` that fades over 1.4s (from the Measure Map `flash`).

---

## 9. Accessibility

- Text contrast ≥ 4.5:1 (≥ 3:1 for ≥ 18px or bold ≥ 14px). `--ink-3` is meta-only.
- Status and trust tier always show icon + word, never colour alone.
- Every chart has an `aria-label` summary plus the table view. Keyboard reaches every interactive mark.
- Visible `:focus-visible` ring on everything; tab order follows the visual order; the drawer traps focus and closes on Esc.
- Hit targets ≥ 32px desktop, ≥ 44px touch.
- `forced-colors: active`: borders become `CanvasText`, and charts switch to the texture fill (45°/135° lines) for series identity.

---

## 10. Content and voice

- **Spanish (es-AR) is the default; English is a toggle.** Strings live in message files, never inline.
- Plain, short, active sentences. Say what the number *is* before what it *means*.
- Refusal pattern: "No tengo una métrica para *X*. Lo más cercano es *Y*." + clickable alternatives.
- Clarification pattern: one question, 2–4 options as chips, never free text.
- Never write a number the data did not produce (pipeline step 10).

**Formatting**

| Kind | es-AR | en |
|---|---|---|
| Number | `1.234,5` | `1,234.5` |
| Compact (KPI tiles; from the Measure Map formatter) | `1,23 M` · `456 mil` · `789` | `1.23M` · `456K` · `789` |
| Area | `12.340 ha` | `12,340 ha` |
| Mass / emissions | `3,2 t` · `1.250 kgCO₂e` | `3.2 t` · `1,250 kgCO₂e` |
| Ratio | `64 %` | `64%` |
| Delta | `+3,1 pp` / `−12 %` (true minus sign) | `+3.1 pp` / `−12%` |
| Date | `11 mar 2026` | `Mar 11, 2026` |
| Campaign | `2025/26` | `2025/26` |
| Blank / unknown | `–` (en dash), never `0` | `–` |

Use `Intl.NumberFormat` / `Intl.DateTimeFormat` with the active locale. Units always follow the value.

---

## 11. What carried over from the Measure Map, and what changed

| Kept | Changed |
|---|---|
| Token-only colours, light + dark with the `data-theme` override | Navy-blue accent → neutral greys + one orange brand accent + blue for interaction |
| Eyebrow labels (uppercase, tracked) | Three typefaces → Inter + JetBrains Mono |
| Layer / tier badges (soft bg + strong text) | 16px body → 14px dashboard density; 10px radii → 6–8px |
| Syntax-highlight token set | Card panels with heavier borders → hairlines, no shadows by default |
| Dependency tree, rule ladder, lineage table, coverage heatmap | Sticky left index → app sidebar + ⌘K palette |
| Copy / wrap controls on code blocks | Square-root white→blue heatmap → validated sequential ramp |
| Compact currency formatter ($1.23M / $456K) | Localised to es-AR / en with units |

---

## 12. Token export (for Phase 0)

Phase 0 generates `packages/design-tokens/` from this file:

```
tokens.json         ← single source (W3C design-tokens format), light + dark
tokens.css          ← :root custom properties (generated)
tailwind.preset.ts  ← colors/spacing/radius/fontSize map to var(--token) (generated)
chart-theme.ts      ← series, sequential, diverging, status arrays for the chart registry (generated)
```

A CI check fails if any `.tsx`/`.css` file under `apps/web` contains a raw hex colour or px font size outside the generated files.
