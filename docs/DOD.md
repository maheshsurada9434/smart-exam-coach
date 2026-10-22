# Definition-of-Done audit (spec section 28)

Audited 2026-10-22 against commit history on `main`. "CI" = `.github/workflows/deploy.yml` on GitHub Actions
(lint, typecheck, Vitest unit/integration tests, production build, Playwright end-to-end tests, deploy, live smoke test).
Development happened in a session that could not reach npm, so **every check below was run in CI, not locally**.

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | No generative AI provider integrated | ✅ | No AI packages in `package.json`; `grep -i "openai\|anthropic\|gemini\|langchain"` in `src/` finds nothing |
| 2 | No AI API key required | ✅ | No secrets or env keys used; app is a static build |
| 3 | No AI API requests | ✅ | No network calls in app code except loading its own files (service worker); live smoke test fails on any failed request |
| 4 | No obsolete AI SDK dependency | ✅ | Built from scratch; dependency list in `package.json` |
| 5 | Core app runs without a backend | ✅ | GitHub Pages static hosting; IndexedDB for data |
| 6 | Question bank loads and validates | ✅ | `src/questions/questions.test.ts` (schema, CSV parser, import, duplicates, versions, template, JSON schema sync) |
| 7 | Practice attempts persist locally | ✅ | `src/practice/practice.test.tsx`; e2e step 3–6; backup/restore e2e step 11–12 |
| 8 | Mock-test scores are correct | ✅ | `src/mock/mock.test.tsx` (all correct/incorrect/unanswered, mixed, fractional, sectional); e2e expects exactly 2 / 26 |
| 9 | Negative marking works | ✅ | Same tests; per-section rules from `src/data/exams.ts` |
| 10 | Topic performance from real attempts | ✅ | `src/learning/mastery.ts` + tests; dashboard e2e checks 2 attempts / 50% |
| 11 | Planner generates realistic tasks | ✅ | Budget never exceeded (tested for 5–240 min); e2e sees the revision task |
| 12 | Revision scheduling works | ✅ | SM-2 tests (intervals, failure, EF floor, date boundaries); e2e completes a review |
| 13 | Charts use actual records | ✅ | `src/analytics/*`; screen test checks the text summary from stored attempts |
| 14 | Import and export work | ✅ | Questions (CSV/JSON), content packs (CSV/JSON), student backup; round-trip tests; e2e backup → wipe → restore |
| 15 | Existing user data preserved | ✅ | Migration test v1→v4; no clearing on startup; malformed rows reported not deleted; merge never overwrites |
| 16 | Mobile layouts work | ✅ (automated) | e2e: no horizontal scroll at 320 px and 375 px on all 11 screens. Not checked by a person on a real phone |
| 17 | Animations respect reduced motion | ✅ | e2e emulates `prefers-reduced-motion` and checks the animation duration |
| 18 | GitHub Pages deployment configured | ✅ | Deploy job; live smoke test on the deployed URL checks assets, deep link + refresh, IndexedDB persistence, service worker, offline |
| 19 | Tests and builds actually ran | ✅ | GitHub Actions run history on the repository |
| 20 | Limitations documented honestly | ✅ | README "Known limitations" |

## Measured (CI, production build, Chromium)
- Lighthouse mobile on the local production preview: **Performance 95, Accessibility 100, Best Practices 100**; FCP 1.8–2.0 s,
  LCP 2.5–2.6 s, TBT 100–120 ms, CLS 0 (Lighthouse's simulated slow mobile network; numbers vary between runs).
- Bundle (gzip): **≈275 KB JavaScript, 4.6 KB CSS**. The charts library is only loaded on the Performance screen (≈107 KB).
- Accessibility: axe-core finds no serious or critical WCAG 2.1 A/AA violations on 11 screens in light and dark mode.

## Not done / not verified
- Exam patterns are not checked against official notification PDFs (marked *secondary* in the app). Andaman patterns missing.
- No real question bank or reviewed content packs (only labelled development samples).
- Manual testing on physical phones, screen readers and Safari/Firefox was not performed (automated tests use Chromium).
- App installability (PWA install prompt) was not tested; offline mode was.
- React Hook Form was not used (forms are small); Zod is used for all validation.
