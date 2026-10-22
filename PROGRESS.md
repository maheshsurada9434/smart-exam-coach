# PROGRESS (resume pointer)

Legend: `[ ]` not started, `[~]` in progress, `[x]` done AND verified.
**Next task to do = first line that is not `[x]`.**

## Day 0: Setup
- [x] Spec saved to docs/SPEC.md
- [x] RESUME.md, PLAN.md, PROGRESS.md created
- [x] git repo initialised

## Day 1: Foundation
- [x] Scaffold Vite + React + TS strict
- [x] Tailwind + design tokens + light/dark theme
- [x] Router (HashRouter) + 9 route stubs
- [x] App shell: sidebar + mobile bottom nav
- [x] Base components (Button, Card, Dialog, Toast, Skeleton, Progress, EmptyState)
- [x] ESLint + Prettier + Vitest configured
- [x] GitHub Pages base path + deploy workflow
- [x] Day 1 checks pass (lint, typecheck, test, build) and committed

## Day 2: Data layer + exams
- [x] Dexie schema + migrations
- [x] Exam/syllabus config data
- [x] Backup export/restore + validation
- [x] Day 2 tests + checks pass, committed

## Day 3: Question bank + import
- [x] Zod schema + JSON schema doc + validation + duplicates
- [x] CSV import wizard
- [x] CSV/JSON export + DEV sample dataset
- [x] Day 3 tests + checks pass, committed

## Day 4: Practice engine
- [x] Question selection (all modes)
- [x] Practice UI + feedback + explanations
- [x] Attempts, bookmarks, notes
- [x] Day 4 tests + checks pass, committed

## Day 5: Mock engine
- [~] Scoring engine + tests (written, waiting for CI)
- [~] Exam UI + palette + submit (written, waiting for CI)
- [~] Timer + refresh resume + auto-submit (written, waiting for CI)
- [~] Result/review screens (written, waiting for CI)
- [ ] Day 5 checks pass, committed

## Day 6: Algorithms
- [ ] Mastery + recommendations
- [ ] Study planner
- [ ] SM-2 revision + sessions
- [ ] Day 6 tests + checks pass, committed

## Day 7: Dashboard + content
- [ ] Dashboard (real data)
- [ ] Performance analytics
- [ ] Vocabulary module
- [ ] Current Affairs + Polity framework
- [ ] Day 7 checks pass, committed

## Day 8: QA + docs
- [ ] Playwright E2E (or reported as not runnable)
- [ ] Accessibility + mobile + reduced-motion pass
- [ ] Perf measurement
- [ ] README + schema docs + limitations
- [ ] Definition-of-Done audit

## Session log
- 2026-10-22: Created resume system and day-wise plan. Starting Day 1.
- 2026-10-22: Added 70% token stop rule (stop at 4,500,000 tokens left of 15,000,000).
- 2026-10-22: Weekly usage baseline 29% (user screenshot). Stop at 70% weekly.
- 2026-10-22: BLOCKER on Day 1. `npm install` fails: the session proxy answers 403 to CONNECT for registry.npmjs.org (policy denial, not retried or bypassed). package.json exists; no node_modules; no source code written yet. Day 1 stays at its first task until npm is reachable.
- 2026-10-22: Route changed: npm is blocked here, so all installs/checks run in GitHub Actions on maheshsurada9434/smart-exam-coach. Day 1 code written and pushed. Pages must be enabled by the user (Settings > Pages > Source: GitHub Actions); this session cannot call that API. Next: read CI result, fix, commit package-lock.json from the CI artifact.
- 2026-10-22: DAY 1 DONE. CI run 39760679069: install, lint, typecheck, 3 unit tests, build, Pages deploy all green. package-lock.json committed by CI (next runs use npm ci). Live URL https://maheshsurada9434.github.io/smart-exam-coach/ serves title 'Smart Exam Coach'. NOT verified: assets/JS in a real browser, mobile visuals (this session cannot reach github.io from a browser). Next: Day 2.
- 2026-10-22: Day 2 code written (Dexie db, prefs, backup, exams data from secondary sources, Syllabus + Settings screens, tests). Pushed; waiting for CI.
- 2026-10-22: DAY 2 DONE. CI run 39762388649 green (lint, typecheck, unit + screen tests, build, deploy). Fixed: settings form race on load, toasts moved inside App. Exam patterns are 'secondary' (coaching-site summaries), not checked against ssc.gov.in PDFs; Andaman has no pattern. React Hook Form not used (2 fields). Next: Day 3 question bank + CSV import.
- 2026-10-22: Day 3 code written: question schema + lifecycle, DB v2 migration, CSV parser, import preview/commit, edit with version history, CSV/JSON export, 14-question DEV sample, docs/QUESTIONS.md + JSON schema. Pushed; waiting for CI.
- 2026-10-22: DAY 3 DONE. CI run 39763769384 green (lint, typecheck, all tests incl. v1->v2 migration, import/duplicates/versioning, build, deploy). Not built: student error reports (moved to Day 4 with the practice screen), CSV formula-injection escaping. Next: Day 4 practice engine.
- 2026-10-22: Day 4 code written: engine (selection, weak rule, scoring summary), sessions with resume + timer from stored start, learning/timed modes, dup-safe attempts, results/review/retry, Bookmarks page, notes, error reports (DB v3) shown in question bank. Pushed; waiting for CI.
- 2026-10-22: DAY 4 DONE. CI run 39765053778 green first try (engine, sessions, timed submit idempotency, malformed session guard, end-to-end practice screen test). Weak-topic rule is a simple placeholder (>=5 attempts, <60%) until Day 6 mastery. Error reports stay in this browser only. Next: Day 5 mock test engine.
- 2026-10-22: Day 5 code written: pure scoring (per-section, fractional, round2), buildMock from exam pattern (approved/published only, partial flag + scaled time), deadline-based saves, auto-submit, idempotent submit with frozen result, palette with 5 states, results by section/topic + review, history. Pushed; waiting for CI.
