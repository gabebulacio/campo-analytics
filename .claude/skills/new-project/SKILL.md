---
name: new-project
description: Add a new portfolio project to this monorepo and to gabrielbulacio.com under /projects/<slug> - route folder, personal-page card, paths helper, metadata, optional backend service, docs and changelog. Use when the user says "new project", "add a project", "start another demo", "add X to the portfolio/site", or wants to host a separate repo's app under the domain.
---

# New portfolio project

Site layout: `apps/web/app/page.tsx` is the personal page; each project lives at `/projects/<slug>`. Campo Analytics (`app/projects/campo-analytics/`) is the reference implementation: copy its structure, not its content.

## 1. Decide with the user (ask if not given)
- `slug` (kebab-case), display name, one-paragraph description, year, tech list.
- **Same app or separate deployment?**
  - *Same app* (default): routes live in `apps/web/app/projects/<slug>/`.
  - *Separate repo / Vercel project*: that app sets `basePath: "/projects/<slug>"`, and here you add a rewrite in `apps/web/next.config.mjs` from `/projects/<slug>/:path*` to its deployment URL (see `docs/DEPLOY.md` §4). Nothing else in this repo.
- **Where does its code live?** By default in **its own public repo** (`gabebulacio/<slug>`) with its own README, CI, `CLAUDE.md` and skills; `gabebulacio/worklog-lakehouse` is the reference. This repo then only gets the site page and the card. Only a live web backend that the site calls goes here, in `services/<slug>/`, plus a `/api/<slug>/:path*` rewrite; don't reuse `/api/pipeline`.
- **Live demo or case study?** If it can't run on Vercel (e.g. needs Fabric), the site page is a case study that links to the code and shows real outputs from a local run.

## 2. Scaffold (same-app case)
1. `apps/web/app/projects/<slug>/layout.tsx` with `metadata` (`title: "<Name> · Gabriel Bulacio"`, plain description; say "synthetic data" if it is).
2. `apps/web/app/projects/<slug>/page.tsx`.
3. A path helper like `demoPath` in `lib/paths.ts` (e.g. `export const <camel>Path = ...`) so the prefix is defined once, plus a code-URL constant for a separate repo (see `LAKEHOUSE_CODE`).
4. Project-specific components in `apps/web/components/<slug>/` if they won't be shared.
5. Strings: English only for a case-study page. Only if the page adds the EN/HE toggle, put strings in `lib/i18n.tsx` with `en` and `he` (or a project-scoped strings file if the set is large).
6. Add an `<article className="site-project">` card to `app/page.tsx`, newest first, following the Campo card (name, year, paragraph, tech line, links).

Follow the `web-ui` skill for styling, i18n and RTL.

## 3. Wire up the repo
- `tasks.py`: add tasks for a new service here (and to `dev` if it should start with everything), and keep the docstring accurate. Mirror any new task in `Makefile`.
- `.github/workflows/ci.yml`: add a job for a new service's lint/tests (a separate repo has its own CI).
- `README.md`: add the project to the intro and the repo map. Add `docs/projects/<slug>.md` if the project needs more than a paragraph.
- `docs/decisions/`: an ADR if the project introduces a new stack choice (`adr` skill).
- `docs/CHANGELOG.md`: a new version entry.

## 4. Guardrails
No real company names, logos or client data; label synthetic data as synthetic. Keep private notes out of git (`.gitignore` already covers `Prep entrevista*.md` and `docs/company-research.md`; add patterns for new private files).

## 5. Finish
`verify` skill (web job at minimum), then open `/` and `/projects/<slug>` locally in both languages and a phone width.
