# Gates

One line per gate: date · layer · command(s) and last line of output · approved by.

- 2026-11-20 · 0 Research · three research tracks written to `research/` (consulting-practice, web-and-viz, slop-rules), sources cited and weak ones flagged · approval pending (Gabriel)
- 2026-11-20 · Validator · `python -m pytest -q scripts/tests` → `19 passed`; `python scripts/site_lint.py` → `site lint: 0 block, 22 warn` · approval pending (Gabriel)
- 2026-11-20 · 1 Positioning · positioning options and decisions written (kept local, git-ignored) · waiting for Gabriel's rulings
- 2026-11-20 · Project Finance Checks (React port, synthetic) · `pytest scripts/tests projects/project-finance/tests` → `44 passed`; ruff → `All checks passed!`; web `tsc --noEmit` ok; app `npm run build` → `built`; static-app lint → `0 findings` (38 private terms) · reviews: buyer/slop (10 findings, 9 applied), claims/privacy (hash list replaced by a git-ignored list; 2 findings refuted from the decision log) · waiting for Gabriel's local test
