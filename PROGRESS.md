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
- [x] Scoring engine + tests
- [x] Exam UI + palette + submit
- [x] Timer + refresh resume + auto-submit
- [x] Result/review screens
- [x] Day 5 checks pass, committed

## Day 6: Algorithms
- [x] Mastery + recommendations
- [x] Study planner
- [x] SM-2 revision + sessions
- [x] Day 6 tests + checks pass, committed

## Day 7: Dashboard + content
- [x] Dashboard (real data)
- [x] Performance analytics
- [x] Vocabulary module
- [x] Current Affairs + Polity framework
- [x] Day 7 checks pass, committed

## Day 8: QA + docs
- [x] Playwright E2E (or reported as not runnable)
- [x] Accessibility + mobile + reduced-motion pass
- [x] Perf measurement
- [x] README + schema docs + limitations
- [x] Definition-of-Done audit

## Day 9: Study material
- [x] Generator scripts: Quant (~400) + Reasoning (~400)
- [x] English questions (~350) + English packs (vocabulary, idioms, OWS, grammar)
- [x] GA questions (~350) + Polity + GA fact packs
- [x] Current affairs (researched, sourced) + Andaman patterns
- [~] Starter loader UI + validation tests, CI green (written, waiting for CI)

## Day 10: UI/UX + animation
- [ ] Read ui-ux-pro-max skill, write design decisions
- [ ] Apply design system + motion, CI green (incl. e2e + axe)

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
- 2026-10-22: DAY 5 DONE. CI green after 2 fixes (TS duplicate-key in asMock; Dialog fallback when showModal missing). Tests cover all spec-12 cases: all correct/incorrect/unanswered, mixed, fractional, section marking, timeout, refresh, interrupted, duplicate submit, frozen score. Limitation: local timer/storage is not tamper-proof. Sectional time is proportional (not official). Next: Day 6 mastery, planner, SM-2.
- 2026-10-22: Day 6 code written: dates, mastery labels (docs/ALGORITHMS.md), SM-2, recommendations with reasons, budget-capped planner (day/week, edit, reorder, skip, done+actual, reschedule, manual tasks), Revision (MCQ recall + flashcards, summary), Settings study days + exam date. Practice weak mode now uses mastery. Pushed; waiting for CI.
- 2026-10-22: DAY 6 DONE. CI run 39768019808 green first try (dates, mastery, SM-2, recommendations order, planner budget cap, regenerate keeps user work, reschedule, Revision + Planner screens). Exam relevance not weighted (patterns unverified). Next: Day 7 dashboard, analytics, vocabulary, current affairs/polity.
- 2026-10-22: Day 7A written: analytics/stats (filters, groups, daily/weekly, trend, repeated errors, coverage), dashboard from real data + onboarding, Performance page with Recharts + text summaries + CSV export. Recharts 2.15.0 added (lockfile via CI). Next: 7B content module.
- 2026-10-22: Day 7A green (CI run 39769399495): dashboard + performance. Working on 7B content.
- 2026-10-22: Day 7B written: content schema (word/idiom/ows/grammar/polity/current-affairs/ga-fact) with source/date/text-type rules, DB v4 contentItems, JSON/CSV import + dedupe, Study content page (/content: word of the day, quizzes from stored answers, add to revision), card review in Revision (MCQ or flashcard), DEV sample (no current affairs), docs/CONTENT.md. Pushed; waiting for CI.
- 2026-10-22: DAY 7 DONE. CI run 39769901235 green first try. Study time = measured time on questions (+ planner minutes logged separately); no current-affairs sample content (must come from dated sources). Next: Day 8 QA, accessibility, perf, README, DoD audit.
- 2026-10-22: Day 8 written: service worker (versioned per build, precache.json) + manifest + PNG icons; Playwright e2e (12-step flow, deep link/refresh, 320/375 overflow, reduced motion, axe light/dark, offline) in a CI e2e job; bundle size + Lighthouse notices. Pushed; waiting for CI.
- 2026-10-22: DAY 8 DONE. CI run 39779901340 all green: lint, typecheck, unit/integration, build, Playwright e2e 8/8 (12-step flow, refresh, 320/375 overflow, reduced motion, axe light+dark, offline), deploy, live smoke on the real Pages URL. Lighthouse mobile: Perf 95, A11y 100, BP 100. JS 275 KB gz. E2E found + fixed: answer selection lag in mock/timed practice. Added job timeouts after a stuck runner. See docs/DOD.md. PROJECT COMPLETE (v1).
- 2026-10-22: User asked for full material + design pass. Added Day 9 (material) and Day 10 (UI/UX). Starting Day 9.
- 2026-10-22: Day 9 material built by `node scripts/build-starter.mjs`: 1,685 questions (QA 410, RE 400, EN 481, GA 368, CA 26) + 695 content entries in public/data/. A&N Combined Matric Level 2026 Tier I pattern added (secondary sources). Fixed normalize() so '-1' != '1' and math operators count. Loader UI + tests written; waiting for CI.
