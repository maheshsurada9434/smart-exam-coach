# PROGRESS (resume pointer)

Legend: `[ ]` not started, `[~]` in progress, `[x]` done AND verified.
**Next task to do = first line that is not `[x]`.**

## Day 0: Setup
- [x] Spec saved to docs/SPEC.md
- [x] RESUME.md, PLAN.md, PROGRESS.md created
- [x] git repo initialised

## Day 1: Foundation
- [~] Scaffold Vite + React + TS strict (written, waiting for CI)
- [~] Tailwind + design tokens + light/dark theme (written, waiting for CI)
- [~] Router (HashRouter) + 9 route stubs (written, waiting for CI)
- [~] App shell: sidebar + mobile bottom nav (written, waiting for CI)
- [~] Base components (Button, Card, Dialog, Toast, Skeleton, Progress, EmptyState) (written, waiting for CI)
- [~] ESLint + Prettier + Vitest configured (written, waiting for CI)
- [~] GitHub Pages base path + deploy workflow (written, waiting for CI)
- [ ] Day 1 checks pass (lint, typecheck, test, build) and committed

## Day 2: Data layer + exams
- [ ] Dexie schema + migrations
- [ ] Exam/syllabus config data
- [ ] Backup export/restore + validation
- [ ] Day 2 tests + checks pass, committed

## Day 3: Question bank + import
- [ ] Zod schema + JSON schema doc + validation + duplicates
- [ ] CSV import wizard
- [ ] CSV/JSON export + DEV sample dataset
- [ ] Day 3 tests + checks pass, committed

## Day 4: Practice engine
- [ ] Question selection (all modes)
- [ ] Practice UI + feedback + explanations
- [ ] Attempts, bookmarks, notes
- [ ] Day 4 tests + checks pass, committed

## Day 5: Mock engine
- [ ] Scoring engine + tests
- [ ] Exam UI + palette + submit
- [ ] Timer + refresh resume + auto-submit
- [ ] Result/review screens
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
