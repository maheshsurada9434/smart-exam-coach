# Smart Exam Coach

**Study Smarter. Practice Better. Improve Every Day.**

A free, local-first preparation app for SSC (CGL, CHSL, MTS, GD) and Andaman & Nicobar recruitment exams.
Live: **https://maheshsurada9434.github.io/smart-exam-coach/**

- **No AI anywhere.** No AI/LLM APIs, SDKs or keys. Personalisation uses documented, deterministic rules ([docs/ALGORITHMS.md](docs/ALGORITHMS.md)).
- **No backend, no accounts, no paid services.** A static site on GitHub Pages; all student data stays in the browser (IndexedDB).
- **Honest content.** A starter bank of ~1,700 original practice questions and ~700 study entries is included and labelled
  "Original practice set by Claude, not expert-reviewed" (maths/reasoning answers are computed by `scripts/`, so they are
  correct by construction; English/GA were written by hand). No previous-year questions are claimed. Current affairs carry
  their source link and date. You can import your own reviewed material at any time.

## Features
| Area | What it does |
|---|---|
| Dashboard | Real figures only (attempts, accuracy, time on questions, latest mock, revision due, coverage, mastery, today's plan, recommended next step); onboarding for new students |
| Study Planner | Daily/weekly plan within your daily minutes; every task shows why; edit, reorder, skip, mark done with actual minutes, move unfinished tasks to today |
| Practice | Topic, subject, mixed, weak-topic, wrong-answer and bookmark modes; learning mode (instant explanation) or timed; resumes after refresh |
| Mock Tests | Full or sectional tests from the exam pattern; negative marking per section; palette with mark-for-review; deadline-based timer and auto-submit; frozen results and review |
| Revision | SM-2 spaced repetition for wrong answers, bookmarks and study content; multiple-choice recall or flashcards |
| Performance | Charts and tables by day, week, subject, topic; mock history; trend; repeated mistakes; CSV export |
| Syllabus | Exam patterns with source and verification status; topic lists |
| Question bank | CSV/JSON import with preview, validation and duplicate checks; lifecycle draft → reviewed → approved → published → archived; version history; student error reports |
| Study content | Vocabulary (with Telugu meanings where provided), idioms, one-word substitution, grammar, Polity, current affairs, GA facts; quizzes from stored answers |
| Settings | Target exam, daily minutes, study days, exam date, backup and restore |

Works offline after the first visit (service worker), installable as an app, light/dark theme, respects reduced motion.

## Run locally
```bash
npm ci
npm run dev        # http://localhost:5173/smart-exam-coach/
npm run lint && npm run typecheck && npm test
npm run build && npm run preview
npx playwright install chromium && npm run e2e   # end-to-end tests against the production build
```
Node 22 is used in CI.

## Deploy to GitHub Pages
1. Push this repository to GitHub (public repositories get free Pages).
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. Push to `main`. `.github/workflows/deploy.yml` installs from the lockfile, runs lint, type checks, unit tests, the production build and the Playwright end-to-end tests, then publishes `dist/`.
4. If you rename the repository, change `base` in `vite.config.ts` to `/<new-name>/`.

No secrets or API keys are needed.

### Troubleshooting
| Symptom | Cause / fix |
|---|---|
| Blank page, 404s for `/assets/...` | `base` in `vite.config.ts` does not match the repository name |
| Deploy job fails "Pages not enabled" | Set Pages source to *GitHub Actions* (step 2) |
| A page 404s after refresh | Use the `#/` addresses (the app uses hash routing for static hosting) |
| Old version still showing | The service worker updates on the next load; close and reopen the tab |
| `npm ci` fails in CI | `package.json` changed without the lockfile; CI falls back to `npm install` and commits the new lockfile |

## Data, backup and restore
- Student records (preferences, attempts, sessions, bookmarks, notes, plan, revision, error reports) live in this browser's IndexedDB.
  They are **not encrypted and not synced**. Clearing site data, private browsing, or losing the device deletes them.
- **Settings → Download backup** saves a JSON file. **Restore from file** validates it first, then **Merge** (adds only new records) or
  **Replace** (asks for confirmation). The question bank and study content are exported separately from their own pages.
- The database is versioned (now v4) with migrations; it is never cleared on startup and malformed rows are reported, not deleted.
  See [docs/DATA.md](docs/DATA.md).

## Starter material
**Settings → Open question bank → Load starter bank** (1,685 questions: Quant 410, Reasoning 400, English 481, GA 368,
Current affairs 26). **Syllabus/Revision → Study content → Load starter pack** (695 entries: 204 words, 105 idioms, 135 one-word
substitutions, 30 grammar rules, 57 Constitution articles, 138 GA facts, 26 current affairs). Both can be removed again, and
both work offline once the app has been opened. Enough questions exist for full-length CGL, CHSL, MTS, GD and A&N Tier I mocks.

## Updating questions and content (no code changes)
- Questions: **Settings → Open question bank → Import**. Format, rules and template: [docs/QUESTIONS.md](docs/QUESTIONS.md),
  [docs/question-bank.schema.json](docs/question-bank.schema.json), `public/templates/questions-template.csv`.
- Study content: **Syllabus/Revision → Study content → Import a content pack**. See [docs/CONTENT.md](docs/CONTENT.md).
- Only **approved/published** questions are used in scored mock tests; only **published** in practice.

## Browser support
Current Chrome, Edge, Firefox and Safari (desktop and mobile) with IndexedDB. Automated end-to-end tests run on Chromium only.
In private/incognito windows storage may be blocked or cleared when the window closes.

## Known limitations
- **Exam patterns are not officially verified.** CGL, CHSL, MTS, GD and the A&N Combined Matric Level 2026 Tier I patterns come
  from published summaries (sources shown in the app) and are marked as such; check them against the official notifications
  (ssc.gov.in, erecruitment.andamannicobar.gov.in). Other A&N posts use different patterns that are not included.
- **The starter material is not expert-reviewed.** Questions and study entries were written by Claude (maths/reasoning answers
  computed by a program). Current affairs come from coaching-site summaries (Sept–Oct 2026), not primary sources, and will date.
  Telugu meanings are only in the development sample. Rebuild the material with `node scripts/build-starter.mjs`.
- **Local exams are not tamper-proof.** The timer and answers are stored in the browser; a determined user can alter them. This is
  not a substitute for a server-controlled exam.
- **No ranks or percentiles**, because there is no comparison group. **No sync** between devices.
- Sectional test time is the paper time scaled by question count (not an official sectional time).
- "Study time" is measured time on questions; reading time is not tracked.
- Error reports stay in the browser where they were made (there is no server).
- The Telugu meaning in the development sample has not been reviewed by a Telugu speaker.
- Exported CSVs are not protected against spreadsheet formula injection; open them only from trusted sources.

## Future improvements
Verified exam patterns from notification PDFs, Andaman post-specific patterns, reviewed question and vocabulary packs,
optional opt-in sync, Hindi/Telugu interface, more chart filters.

## Docs
[ALGORITHMS](docs/ALGORITHMS.md) · [DATA](docs/DATA.md) · [QUESTIONS](docs/QUESTIONS.md) · [CONTENT](docs/CONTENT.md) ·
[Definition-of-Done audit](docs/DOD.md) · [Specification](docs/SPEC.md) · [Build plan](PLAN.md) · [Progress log](PROGRESS.md)
