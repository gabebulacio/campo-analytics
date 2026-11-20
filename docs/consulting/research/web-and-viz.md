# Web and data-viz research: what gabrielbulacio.com should adopt

Research track B, 2026-11-20. Scope: reference sites, consulting-portfolio patterns, web data-viz practice, and the craft and performance bar. It builds on the slide research in the private case kit (one accent plus greys, direct labels, zero-based bars, no dual axes, a table behind every chart, WCAG contrast for marks). Those rules are not repeated here. This file adds what changes on the web: interaction, mobile, dark mode, screen readers and page performance.

**Method and limits.** Pages were fetched as text (HTML converted to markdown), so layout and type observations come from page structure and copy, not from rendered visuals. ft.com refused automated fetches and observablehq.com returned HTTP 429; both are covered through secondary sources or left out. NYT graphics were not fetched directly. Grading: **Empirical** = controlled study; **Practitioner** = expert guidance; **Standard** = W3C, web.dev or framework docs; **Observed** = what the fetched page shows; **Derived** = my recommendation, not a cited rule.

**Current site, as read on 2026-11-20** (`apps/web/app/page.tsx`, `app/layout.tsx`, `app/globals.css`):

| Item | State |
|---|---|
| Hero | Name as H1, then three paragraphs (about 150 words) before any offer; facts aside with "Book an intro call", LinkedIn, GitHub |
| Offer | No services or engagements section; the page reads as a CV plus projects |
| Proof | Two projects with three stats each ("98% correct results, 77 questions × 3 runs"); stats link to nothing that explains the method |
| Fonts | Inter, JetBrains Mono and **Cal Sans** (display, home only) loaded in the root layout for every route. Cal Sans is not in the style guide |
| Social preview | `openGraph` has no image; `twitter.card` is `summary`. No `opengraph-image` file anywhere under `app/` |
| Motion | Global `prefers-reduced-motion: reduce` kill switch exists (`globals.css` line 179) |

---

## 1. Summary

| # | Pattern | Why | Where on gabrielbulacio.com | Effort |
|---|---|---|---|---|
| 1 | Hero = one sentence on who you help and with what, one proof line, one CTA | Every product and studio site studied leads with the offer in under 20 words (Linear, Fathom, Interactive Things). The current hero spends 150 words on biography first | Home hero. Move the physics and HTR paragraphs to an About section lower down | S |
| 2 | Services as 3 named engagements with scope, length, deliverables and "good fit if" | Studios list services (Interactive Things: six categories with "See our work" links); independent consultants who omit them (Scherer, Stefaner) rely on reputation Gabriel does not yet have publicly | New "Engagements" section on home, below the hero | M |
| 3 | Outcome headline plus metric-with-caption on every case card | Stripe and Vercel cards: "X increases Y by 10%", big number, short caption. Thoughtworks and Brooklyn Data show logos and almost no numbers, which reads weaker | Project cards on home (already have stats; rewrite the H3 as an outcome) | S |
| 4 | Every number links to its method (n, date, data type) | Our World in Data puts unit, source, date range and processing next to every chart; Stripe and Vercel do not, and their numbers are unverifiable. Method links are Gabriel's differentiator ("trust is visible", style guide P4) | Stats component: each `dt` gets a footnote link to a Method section on the case page | S |
| 5 | Case-study page anatomy: outcome title, at-a-glance box, problem, constraints, what I built, results with method, what I'd change, links, CTA | Composite of Stripe (challenge/solution), Vercel ("Impact at a glance"), Distill (byline, dates, corrections) and OWID (sources, how to cite) | `/projects/*/case` pages; one shared layout component | M |
| 6 | Dated byline and "Updated" line on case studies | Distill shows authors, date, DOI and an Updates and Corrections section. Dates signal the work is current | Case-study header | S |
| 7 | Static, annotated charts; no scrollytelling | Steppers beat scroll layouts on comprehension (Zhi et al. 2019); scroll pieces are brittle on mobile (Samora 2017, Kosara 2016). A consulting buyer skims | All case-study charts | S |
| 8 | Annotation in the chart on desktop, moved below the chart on mobile | Datawrapper and the EU data-viz guide: annotations inside when space allows, listed under the chart when not | Chart wrapper component | M |
| 9 | Hover is a bonus, never the only route to a value | Aisch 2017: crucial information must not hide behind clicks or hovers. Touch has no hover | Recharts tooltips: keep, but put the key value in a direct label | S |
| 10 | Table view and an `aria-label` summary on every web chart | Already a style-guide rule; most chart libraries ship without it (ApexCharts audit: 6 of 10 libraries have no role, name or table by default) | Chart wrapper: `<figure>` + `<figcaption>` + `<details>` table | M |
| 11 | Generated OpenGraph image per page, 1200×630, `summary_large_image` | Links to the site are shared in LinkedIn and email; today they render as a bare text card | `app/opengraph-image.tsx` and one per case route | S |
| 12 | Core Web Vitals green at p75 on mobile: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 | web.dev thresholds. Recharts and three font families are the main risks | Whole site; lazy-load charts below the fold | M |
| 13 | Fix WCAG 2.2 items portfolios miss: focus hidden under the sticky top bar (2.4.11), 24px targets on inline links in dense lists (2.5.8), contact in the same place on every page (3.2.6) | New in WCAG 2.2 at A/AA; rarely checked | `globals.css` (`scroll-padding-top`), top bar, footer | S |
| 14 | A site-level type scale for prose pages (16–18px body) next to the 14px app scale | The style guide was written for a dense dashboard. Every reading-first site studied uses larger body text and one column | Style guide §4, new "site" scale | S |
| 15 | Decide on the display face: drop Cal Sans or add it to the style guide | Undocumented third family; style guide §4 says one sans plus one mono. It loads on every route | `layout.tsx`, style guide §4 | S |

---

## 2. Reference sites

"Borrow" lists the one or two patterns worth taking. "Avoid" is what not to copy. Fetch status in the last column.

| Site | Type | Borrow | Avoid | Fetched |
|---|---|---|---|---|
| Pentagram, pentagram.com/work | Design studio | Grid of projects, each with title, one-sentence description and sector tags; filters by sector and discipline; clean slugs (`/work/{slug}`) | A 40-project grid only works with a large body of work; with 2–4 projects a grid looks empty | Yes (work index only; case page not opened) |
| Thoughtworks, thoughtworks.com/clients | Consultancy | Stories grouped by industry, each with a capability tag (AI/ML, legacy modernisation) and an outcome-phrased headline | Almost no numbers ("saves millions"); inconsistent CTA wording per section | Yes |
| Fathom, fathom.info | Information-design studio | Headline states what they build in one line ("We build platforms and products for understanding data"); the featured project tile explains the before/after in one sentence | Client-logo grid as the main proof; Gabriel's home page already, correctly, declines logos | Yes |
| Interactive Things, interactivethings.com | Data-viz studio | Services as six named categories, each linking to filtered work; one "See what we can do for you" CTA high on the page; "Get in touch" at the end | Logo wall ("Trusted by leading organizations") | Yes |
| Brooklyn Data, brooklyndata.co | Data consultancy | Services framed as five outcome areas (governance, strategy, engineering, AI/DS, performance management) | Generic hero ("Transform your organization through the power of data"); proof is partner badges and logos, no measured result | Yes |
| Truth & Beauty (Moritz Stefaner) | Independent data-viz studio | "Featured projects" list: title, purpose-first blurb, year. Purpose over tech stack | No contact CTA in the page text; works only with an existing reputation | Yes |
| Cédric Scherer, cedricscherer.com | Independent data-viz consultant | "Schedule a discovery call" in the hero and again in the footer ("Want to hire me for a project or training?") | Projects mixed into a blog feed; no services list, no measured outcomes | Yes |
| Linear, linear.app | Product | One-sentence hero, then three value pillars, then feature blocks each shown with a real product state; changelog on the home page as proof of momentum | Main CTAs only at the bottom (in the fetched text); product mockups that are not real data | Yes |
| Stripe customers, stripe.com/customers | Product proof | Headline format "Customer + verb + metric"; big figure with short caption ("$70M"); filters by size and use case | Metrics with no method or period stated | Yes |
| Vercel customers and Web Interface Guidelines, vercel.com/customers, vercel.com/design/guidelines | Product proof, craft rules | "Impact at a glance" block before the narrative; the guidelines checklist (visible focus, 24/44px targets, URL as state, tabular numbers, explicit image size, subset fonts) | Teaser metrics that change unit card to card | Yes |
| Rauno Freiberg, rauno.me | Designer, personal | Name, one-line bio, four nav destinations, a short stated philosophy; click-to-copy email with a "Copied" state | Craft-as-portfolio suits a designer seeking a job, not a consultant selling outcomes | Yes (text only, no visual detail) |
| Paco Coursey, paco.me | Engineer, personal | Single column; sections Building, Projects, Writing, Now, Connect; each entry is one linked line | Too sparse for a buyer who needs scope and results | Yes (text only) |
| The Pudding, pudding.cool | Data journalism | Teaser = date, title, one-sentence dek phrased as the finding or the question | Feed interrupted by newsletter and merch promos | Yes |
| Our World in Data, ourworldindata.org | Data explainer | Chart page anatomy: title, then a definition list (source, unit, date range, last updated, researcher), key takeaways, collapsible caveats, "how we processed this", downloads (CSV, API, code), "How to cite" | Full download/API apparatus is overkill for a portfolio; take the definition list and the processing note | Yes (grapher page) |
| Distill, distill.pub | Research explainer | Byline block (authors, affiliation, date, DOI); numbered references; Updates and Corrections; Reuse; BibTeX | Academic density; no CTA | Yes (2017 article) |
| Datawrapper blog, datawrapper.de/blog | Viz practice | Title states the message in everyday words; details go to description and notes; direct labels over keys; automatic dark mode that preserves contrast | Tool-specific features (their dark-mode algorithm) that Recharts will not do for you | Yes (two posts) |
| Maggie Appleton, maggieappleton.com | Personal, visual essays | Content typed by kind (Essays, Notes, Patterns, Library), each with its own metadata; relative age on essays | "Digital garden" framing is for writers; consulting buyers want work first | Yes |
| Josh Comeau, joshwcomeau.com | Personal, teaching | Category browse plus a numbered "Popular" list; dark-mode toggle; a "Disable sounds" control | Sale banners above content; sound effects | Yes |
| Bret Victor, worrydream.com | Personal, research | Each project as "title: one-line tagline", grouped by theme and year | Archive-style home with no current offer | Yes |
| Amelia Wattenberger, wattenberger.com | Personal, data viz | Every entry carries a category tag ("data viz", "AI") and a one-line description | Mixed tweets, posts and work in one list | Yes |
| FT Visual and Data Journalism | Data journalism | (Visual Vocabulary already cited in viz.md) | – | **No** (ft.com blocks fetches) |
| Observable blog | Viz tooling | – | – | **No** (HTTP 429) |

---

## 3. Principles

Each principle: what to do, the evidence, and how it lands on this site within the style guide. "Style guide change" marks where `docs/style-guide.md` should be edited and why.

### P1. Lead with the offer, not the biography

- **Sources.** Linear home (Observed, fetched 2026-11-20): one-sentence hero, subhead, product state. Fathom (Observed): "We build platforms and products for understanding data". Interactive Things (Observed): tagline plus "See what we can do for you". Counter-examples: Brooklyn Data's generic hero, Rauno's craft-only intro.
- **How we apply it.** Hero = H1 name stays (it is the brand), then one `--t-body-lg` sentence of 20–30 words on who he helps and with what ("I help finance and operations teams get numbers they can trust: semantic models on Microsoft Fabric and Power BI, and AI that answers only from governed metrics."). Below it, one proof line from a project ("98% correct answers on 77 test questions, synthetic data") linking to the method, and the one primary button "Book an intro call" (style guide: one primary per view). The three current paragraphs move to an "About" section after the projects. The facts aside stays.
- **Derived rule.** Above the fold on a 390×844 phone: name, the one sentence, the proof line and the primary button. Nothing else needs to fit.

### P2. Present services as engagements with edges

- **Sources.** Interactive Things services list (Observed); Brooklyn Data five outcome areas (Observed); Scherer and Stefaner have none and rely on reputation (Observed).
- **How we apply it.** Three cards in a row (stacked on mobile), each: name, one sentence of the problem it solves, typical length, deliverables (3 bullets), "Good fit if…", link to the case study that proves it. Candidates that match the existing work: (1) data-foundation assessment and roadmap, (2) semantic model and KPI layer on Fabric/Power BI (proof: Worklog Lakehouse), (3) governed generative-BI pilot (proof: Campo Analytics). Cards use the existing card spec (`--surface`, 1px `--line`, `--r-md`). No icons or illustrations (style guide §2).
- **Open decision for Gabriel.** Whether to show a starting price or "from" range. None of the studied studios do; some independent consultants do. Not researched further here.

### P3. Proof is a number, a caption and a method link

- **Sources.** Stripe customer cards ("Twilio increases its authorization rates by 10% with Stripe"; big figure plus caption) and Vercel "Impact at a glance" (Observed). OWID chart pages state unit, source, date range and processing next to the chart (Observed). Thoughtworks and Brooklyn Data show almost no numbers (Observed), which is the weaker pattern.
- **How we apply it.** Keep the `Stats` component and its three-number limit. Add to each number: unit in the caption (already done), the denominator and data type ("77 questions × 3 runs, synthetic data"), and a superscript link to `#method` on the case page. Rewrite each project H3 as name plus outcome ("Campo Analytics: answers that trace back to their SQL"). KPI and hero numbers keep proportional figures (style guide §4); tables use tabular figures.
- **Honesty rule (Derived).** Since both projects run on synthetic or adapted data, every proof line says so where the number appears, not only in the footer. A buyer who finds the caveat later trusts the rest less.

### P4. One case-study template

- **Sources.** Stripe story pages (challenge, solution, products, pull quote; inferred from excerpts), Vercel story pages (impact at a glance, "The problem", narrative), Distill byline and corrections block, OWID "how we processed the data" and "how to cite" (all Observed).
- **Anatomy (Derived from the above).**

| Order | Block | Content |
|---|---|---|
| 1 | Eyebrow + H1 | `CASE STUDY · 2026` · outcome title in plain words |
| 2 | Byline line | Role ("Sole engineer"), dates, "Updated Nov 20, 2026", data type (synthetic / adapted from production) |
| 3 | At a glance | 3 stats with captions; stack; links to demo and code |
| 4 | Problem | 2–4 sentences: who had the problem and what it cost them |
| 5 | Constraints | Bullets: data, governance, budget, time |
| 6 | What I built | One architecture diagram, then short sections; code blocks only where a reader would copy them |
| 7 | Results | Annotated charts (P6), each with a table view |
| 8 | Method | How each headline number was measured: n, runs, dates, what counts as correct, known gaps |
| 9 | What I would do differently | 2–3 bullets. Signals judgement |
| 10 | CTA | "Have a similar problem? Book an intro call" (same button as home) |

- **Style guide change.** Add a "Case study" entry to §6 Components with this order, so both existing case pages converge on it.

### P5. Navigation: two clicks to any proof, same contact in the same place

- **Sources.** Rauno (four destinations) and Paco (five sections, no menu) keep navigation shallow (Observed). WCAG 2.2 SC 3.2.6 Consistent Help (Level A): help or contact mechanisms repeated across pages appear in the same relative order (Standard, W3C "What's new in WCAG 2.2", updated 5 Oct 2023).
- **How we apply it.** Top bar on every page: name (home), Work, Engagements, About, and "Book a call" as a ghost link at the inline end, before the theme button. Project pages keep their breadcrumbs. Home → case study → method anchor is the deepest path. Hebrew project pages mirror the order under RTL.

### P6. Charts on the web: title states the finding, annotation carries the reason

- **Sources.** Lisa Charlotte Muth, "How to write text for data visualizations", Datawrapper blog, 28 Sep 2022, https://www.datawrapper.de/blog/text-in-data-visualizations (Practitioner): everyday wording in the title, main message first, details in the description and notes, direct labels instead of a key. Amanda Cox (NYT) quoted in Gestalten, "Visualizing a new New York Times" (undated, **weak**): "The annotation layer is critical." Ajani et al. 2021 (Empirical, already in viz.md): focus plus annotation improves recall.
- **How we apply it.** Each chart is a `<figure>`: an `--t-h3` title that states the finding with a number, a `--t-small` `--ink-2` subtitle with unit, denominator, n and period, the plot, then a `figcaption` line with source and "Show table". One accent for the series the title names, rest in greys (viz.md P2). Annotations as text in `--ink`, with a 1px `--line-strong` leader.
- **Style guide change.** §7.3 says "Legend for 2 or more series". viz.md ruling V1 already replaced this with direct labels for the deck. Apply the same on the web for ≤ 4 series; keep a legend only above 4 series or when labels collide. Reason: legends force eye travel and color matching (NN/g 2022, Datawrapper 2023, both in viz.md).

### P7. No scrollytelling; static first, one stepper at most

- **Sources.**
  - Hohman, Conlen, Heer, Chau, "Communicating with Interactive Articles", Distill, 11 Sep 2020, https://distill.pub/2020/communicating-with-interactive-articles/ (Practitioner review of Empirical work). Reports Zhi et al. 2019: better comprehension with slideshow (stepper) layouts than vertical scroll layouts; McKenna et al. 2017: readers preferred step or scroll over static, but no engagement difference between the two. Both desktop-only. Also: interactive pieces cost more to build, break as web tech changes, use more bandwidth, and can worsen accessibility.
  - Robert Kosara, "The Scrollytelling Scourge", eagereyes, 25 May 2016, https://eagereyes.org/blog/2016/the-scrollytelling-scourge (Practitioner): readers cannot judge length or jump; scroll-jacking; replay is awkward. Recommends a stepper with numbered steps.
  - Russell Samora, "Responsive scrollytelling best practices", The Pudding, Apr 2017, https://pudding.cool/process/responsive-scrollytelling/ (Practitioner): on mobile, keep scroll only when transitions carry meaning; otherwise stacked static charts perform better and ship faster; avoid `vh` (mobile toolbars resize the viewport); replace hover with fixed annotations.
  - Gregor Aisch, "In Defense of Interactive Graphics", vis4.net, 31 Mar 2017, http://www.vis4.net/blog/in-defense-of-interactive-graphics/ (Practitioner): do not hide crucial information behind clicks or hovers; optional interaction (tooltips, exploration) still adds value. He clarifies the widely quoted "85% of readers don't interact" figure measured clicks on one button, not engagement with the graphic.
  - NYT graphics editors advocated scroll input because readers did not reach content behind tabs, buttons or sliders (cited as Tse 2016 in McKenna et al., "Visual Narrative Flow", EuroVis 2017, https://users.cs.utah.edu/~miriah/publications/narrative-flow.pdf). Original talk not found (**weak**, secondary).
- **How we apply it.** Case studies use stacked static charts that read without interaction. Tooltips stay as an extra. If one explainer truly needs a sequence (for example "question → plan → SQL → answer" in Campo Analytics), use a stepper with numbered steps and Next/Previous buttons, state in the URL (Vercel guidelines), and every step reachable by keyboard. No scroll-linked animation anywhere.

### P8. Mobile charts are a different layout, not a smaller one

- **Sources.** Nadieh Bremer, "Mobile vs Desktop Dataviz", Visual Cinnamon, 17 Apr 2019, https://www.visualcinnamon.com/2019/04/mobile-vs-desktop-dataviz/ (Practitioner): fill width and let height grow; scale with a minimum width; keep fonts at readable size independently; drop non-essential labels; stack instead of side-by-side; build a simpler chart if needed. Datawrapper "Datawrapper becomes a mobile-first charting tool" and "Making column and pie charts great on mobile and desktop" (dates not checked, **search snippets only**). EU Data Visualisation Guide, "Responsive text annotations", https://data.europa.eu/apps/data-visualisation-guide/responsive-text-annotations (Practitioner, not opened): annotations inside the chart when space allows, listed below when not.
- **How we apply it.** Under `md` (768px): chart height rises (aspect about 4:5 instead of 16:9), horizontal bars over columns for any category labels, ticks cut to 3–4, annotations move to a numbered list under the plot with matching numbered markers, small multiples go to one column on the shared scale. Axis text never below 12px. Recharts `ResponsiveContainer` measures the DOM, so give the wrapper an explicit `aspect-ratio` in CSS to avoid layout shift (CLS).

### P9. Accessible charts: figure, summary, table, keyboard

- **Sources.** Sara Soueidan, "Implementing Accessible Data Charts for the Khan Academy 2018 Annual Report" (2019, https://sarasoueidan.com/blog/accessible-data-charts-for-khan-academy-2018-annual-report/, Practitioner; search snippet only): rewriting SVG semantics with ARIA roles is risky given uneven screen-reader support; a text alternative hidden from screen readers was not exposed, fixed with `aria-labelledby`. ApexCharts, "We Ran an Accessibility Audit on 10 JavaScript Charting Libraries" (**vendor, weak**): 6 of 10 libraries render with no role, name, description or table by default. W3C Understanding SC 1.4.11 and 1.4.1 (Standard, in viz.md).
- **How we apply it.**
  - `<figure aria-labelledby={titleId} aria-describedby={summaryId}>`; the summary is one visible sentence (the finding with the numbers), not hidden text.
  - Below the chart a `<details><summary>Show table</summary><table>…</table></details>`, with a real `<caption>`, `<th scope>` and tabular figures. Visible to everyone, not screen-reader-only, which also serves Finance readers who want the numbers.
  - The SVG itself: `role="img"` with an `aria-label` that repeats the title, so a screen reader does not walk hundreds of path nodes. Recharts 3 has an `accessibilityLayer` prop for keyboard navigation of tooltips; I could not fetch its docs page (404), so **verify against the installed version** before relying on it.
  - Any brush, zoom or drag on a chart needs a button or input alternative (WCAG 2.2 SC 2.5.7 Dragging Movements, AA).

### P10. Dark mode for charts: chosen values, same contrast

- **Sources.** Lisa Charlotte Muth, "Dark mode for embedded visualizations", Datawrapper blog, 26 Jan 2022, https://www.datawrapper.de/blog/dark-mode-for-embedded-visualizations (Practitioner): colors are recomputed so contrast against the background stays the same ("very dark on white becomes very bright on black"); this covers gridlines, text, keys, highlight ranges and annotations; preview every chart in both modes; enable only if the whole site respects `prefers-color-scheme`. ProPublica, "Working with Dark Mode", https://guides.propublica.org/design/dark-mode (Practitioner, **not opened**).
- **How we apply it.** The style guide already does this right: dark is a set of chosen values, and §7.1 has validated dark series colours. Add two rules: (1) chart greys (context marks, gridlines, baseline) come from `--line`, `--line-strong`, `--ink-3` so they flip with the theme, never a fixed hex in the chart registry; (2) the project thumbnails already ship light and dark captures (`Shot` component); every static chart image must do the same or be a live SVG.
- **Style guide change.** §7 should define the context grey for de-emphasised marks as a token pair (light and dark). viz.md's `#B8BEC6` exists for slides only; the web needs a dark counterpart checked against `#1B1B1B`.

### P11. Performance bar

- **Sources.** web.dev, "Web Vitals" (updated 31 Oct 2024), https://web.dev/articles/vitals (Standard): LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1, at the 75th percentile, mobile and desktop separately. web.dev, "AVIF" (Learn Images, undated), https://web.dev/learn/images/avif (Standard): smaller than JPEG or WebP at similar quality; supported in Chrome/Opera 2020, Firefox 2021, Safari 2022; provide fallbacks. Vercel Web Interface Guidelines (undated, no author), https://vercel.com/design/guidelines (Practitioner): explicit image dimensions, preload only above-the-fold images, subset fonts, preload critical fonts.
- **How we apply it.**

| Area | Rule on this site |
|---|---|
| Budget | Home and case pages: LCP ≤ 2.0 s on a mid-range phone in lab tests (headroom under the 2.5 s field target); CLS ≤ 0.05; INP ≤ 200 ms. Check with Lighthouse mobile and Vercel Speed Insights field data |
| LCP element | On home it should be the hero text, not a screenshot. Thumbnails are below the hero; keep them lazy (next/image default) and mark only one above-the-fold image `priority` if any |
| Fonts | `next/font` self-hosts and subsets already (style guide §4 satisfied). Three families preload on every route. Set `preload: false` on JetBrains Mono for the home page route or move it to project layouts; resolve Cal Sans per summary row 15 |
| Images | Keep `.webp` sources; add `images.formats: ['image/avif', 'image/webp']` in `next.config` so next/image serves AVIF where supported, with WebP fallback |
| Charts | Recharts is client JS. Render charts below the fold with `next/dynamic` and a fixed-aspect placeholder; set `isAnimationActive={false}` under reduced motion |
| Hebrew | Inter and Cal Sans have no Hebrew glyphs, so Hebrew text falls back to the OS font (Segoe UI on Windows, SF on Apple). Acceptable; if a matched face is wanted, add a Hebrew subset family through `next/font` and measure its weight cost first |

### P12. Motion: purposeful, short, and off when asked

- **Sources.** Vercel guidelines (Practitioner): animate `transform` and `opacity` only; no `transition: all`; provide a reduced-motion variant. WCAG 2.2 SC 2.3.3 Animation from Interactions (AAA; Standard, not re-fetched).
- **How we apply it.** Style guide §8 already sets 120/200/300 ms and a reduced-motion kill switch, and `globals.css` implements it. Add: no scroll-triggered entrance animations on marketing sections (they delay LCP-adjacent content and look templated); chart enter animation once, never on theme switch.

### P13. OpenGraph and share previews

- **Sources.** Next.js docs, "opengraph-image and twitter-image" (updated 18 Nov 2026), https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image (Standard): `opengraph-image.tsx` with `ImageResponse` from `next/og`, `size` 1200×630, `alt` export, statically generated at build by default, fonts passed as file data; per-segment files override parents unless page metadata sets `openGraph.images`.
- **How we apply it.** `app/opengraph-image.tsx`: name, the one-sentence offer, accent bar, light surface, Inter loaded from a local `.ttf`/`.otf` file (pass font data, as in the docs example). One per case route with the outcome title and the top stat. Set `twitter: { card: "summary_large_image" }`. Write the `alt` as the sentence on the image. Do not set `openGraph.images` in page metadata, or it overrides the files.

### P14. WCAG 2.2 AA items portfolios usually miss

- **Source.** W3C, "What's New in WCAG 2.2" (updated 5 Oct 2023), https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/ (Standard). Vercel guidelines for the link and label items (Practitioner).

| Item | Criterion | Check on this site |
|---|---|---|
| Focused element hidden under the sticky top bar | 2.4.11 Focus Not Obscured (Minimum), AA | Add `html { scroll-padding-top: <topbar height + 8px>; }` so tabbing to an anchor or link does not land under the 56px bar |
| Small inline targets | 2.5.8 Target Size (Minimum), AA: 24×24 CSS px or enough spacing | "Case study · Code · Open the demo" links and the theme button. Style guide already says ≥ 32 desktop / 44 touch, which is stricter; check the link row actually meets it |
| Contact in the same place | 3.2.6 Consistent Help, A | "Book a call" in the same top-bar position on home and project pages (P5) |
| Drag-only chart interactions | 2.5.7 Dragging Movements, AA | Any brush/zoom needs buttons |
| Icon-only buttons | 4.1.2 Name, Role, Value, A | Theme button needs an accessible name that states the current mode |
| Links that are not links | Vercel guideline | Navigation must be `<a>`/`<Link>`, so Cmd-click and middle-click work |
| Skip link | 2.4.1 Bypass Blocks, A | Add "Skip to content" as the first focusable element |
| Language of parts | 3.1.2, AA | Hebrew passages inside an English page need `lang="he" dir="rtl"` on the element, not only on `<html>` |
| Ink-3 used for real text | 1.4.3, AA | Style guide marks `--ink-3` meta-only (4.1:1 in light). The home page uses `faint` on years; years are meta, but check nothing essential uses it |

### P15. Writing density

- **Sources.** Pudding teasers: one sentence phrased as the finding (Observed). Bret Victor and Truth & Beauty: "title: one-line purpose" (Observed). Datawrapper text post: everyday words, message first (Practitioner).
- **How we apply it (Derived).** Hero sentence ≤ 30 words. Project blurb ≤ 45 words (current blurbs are 45–55). Service card ≤ 60 words plus bullets. Case-study paragraphs ≤ 4 sentences; prose column capped at 70ch (style guide §4 already). Say what the number is before what it means (style guide §10).
- **Style guide change.** §4 body is 14/22 for "dashboard density". Add a site scale for prose pages: body 16/26 (the existing `--t-body-lg`) as the default on home and case pages, 18/28 for the hero sentence. Reason: every reading-first site studied uses one column and larger body text; 14px suits tables, not paragraphs.

---

## 4. Patterns to avoid

| Pattern | Why | Seen at |
|---|---|---|
| Client-logo wall as main proof | Proves association, not outcome; Gabriel's employers restrict logo use (comment in `page.tsx`) | Fathom, Interactive Things, Brooklyn Data |
| Generic transformation hero | Says nothing a buyer can check | Brooklyn Data |
| Metrics with no period, base or method | Unverifiable; contradicts the site's "trust is visible" principle | Stripe, Vercel, Thoughtworks |
| Scrollytelling and scroll-jacking | Lower comprehension than steppers on desktop, brittle on mobile, accessibility cost | Kosara 2016; Zhi et al. 2019 via Hohman 2020; Samora 2017 |
| Key values only in tooltips | Touch has no hover; most readers never interact | Aisch 2017 |
| Product mockups with fake data | The site's rule is "never write a number the data did not produce" (style guide §10) | Linear (marketing mockups) |
| Banners and promos above the content | Pushes the offer below the fold | Josh Comeau, The Pudding |
| Projects mixed into a blog feed | Buyer cannot find the work | Cédric Scherer, Amelia Wattenberger |
| Large project grid with few projects | Empty cells read as thin experience | Pentagram pattern applied at small scale |
| Scroll-triggered fade-ins on every section | Delays content, adds JS, looks templated | Common template sites (not in the studied set) |
| Bare text share card | Shared links look unfinished in LinkedIn and email | gabrielbulacio.com today |

---

## 5. Source quality flags

| Source | Flag |
|---|---|
| All "Observed" rows in §2 | Fetched as text only; no rendered layout, type or color checked. Claims about visual style are not made |
| Pentagram | Only the work index fetched; case-study page anatomy unknown |
| Stripe story pages | Inferred from excerpts on the customers index, not from a full story |
| FT, Observable | Not fetched (blocked / rate-limited) |
| Amanda Cox quote (Gestalten) | Undated, secondary, from a search snippet. **Weak** |
| NYT "readers don't use tabs or sliders" (Tse 2016) | Known only through McKenna et al. 2017 citation; original talk not found. **Weak** |
| Zhi et al. 2019, McKenna et al. 2017 | Read through the Hohman et al. 2020 review, not the papers. Both desktop-only |
| Kosara 2016, Samora 2017, Aisch 2017, Bremer 2019 | Practitioner and 6–9 years old; still the most cited positions, no newer counter-evidence found |
| Datawrapper mobile-first posts, EU guide responsive annotations | Search snippets only; dates not checked |
| Sara Soueidan Khan Academy case | Search snippet only; 2019 |
| ApexCharts library audit | Vendor content about competitors. **Weak**; used only for "defaults are poor" |
| disabilityworld.org "accessible data viz tooling 2026" | Surfaced in search, not used. **Weak** |
| Recharts `accessibilityLayer` | Docs URL returned 404; behavior not verified for the installed version |
| Vercel Web Interface Guidelines | Undated, no named author; widely used checklist |
| web.dev Vitals (31 Oct 2024), W3C WCAG 2.2 (5 Oct 2023), Next.js OG docs (18 Nov 2026) | Primary standards and docs, current |
| Inter / Cal Sans lacking Hebrew glyphs | From my knowledge of the fonts' character sets, not re-checked today |
