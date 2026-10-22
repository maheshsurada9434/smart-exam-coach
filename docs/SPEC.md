MASTER DEVELOPMENT PROMPT

SMART EXAM COACH — COMPLETE ZERO-AI, ZERO-API-COST EXAM PREPARATION PLATFORM

Act as a principal software architect, senior full-stack developer, competitive-exam specialist, database engineer, UI/UX designer, accessibility engineer, and QA engineer.

Build a complete, production-quality web application named Smart Exam Coach for students preparing for SSC and Andaman & Nicobar Islands recruitment examinations.

This project must be developed from scratch if the repository is empty. If an existing repository is available, inspect it first and preserve any useful working functionality and data.

I have not supplied any previous development prompt. Treat this document as the complete product specification.

NON-NEGOTIABLE REQUIREMENTS

1. Do not use AI or large language models anywhere in the application.
2. Do not integrate Claude API, OpenAI API, Gemini API, or any other generative AI API.
3. Do not require paid subscriptions, API keys, or paid third-party services.
4. Do not implement fake AI features or simulated chatbot responses.
5. Build personalization using deterministic algorithms and actual student performance data.
6. Use a reviewed question bank with real answer keys and explanations.
7. Use GitHub Pages for frontend hosting.
8. Prefer IndexedDB for local-first student data and offline functionality.
9. Use a premium, responsive design with realistic animations.
10. Implement working features, not merely a visual mockup.
11. Test the actual application and report honestly what works.
12. Do not claim that hosting, content verification, or tests are complete unless they have actually been completed.

The goal is a free-to-use, local-first competitive-exam preparation platform that can operate without AI services, private API keys, or a required backend server.

⸻

1. PRODUCT OVERVIEW

Product name: Smart Exam Coach

Tagline: Study Smarter. Practice Better. Improve Every Day.

Primary audience:

* SSC CGL aspirants
* SSC CHSL aspirants
* SSC MTS aspirants
* SSC GD aspirants
* Andaman & Nicobar Administration recruitment candidates
* Students preparing for other configurable competitive examinations

The application should help students:

* Prepare for examinations using topic-wise practice.
* Take realistic timed mock tests.
* Identify weak topics.
* Build personalized study schedules.
* Revise previously learned material.
* Track their performance.
* Learn from mistakes.
* Monitor syllabus coverage.
* Prepare using verified questions and explanations.

This is a local-first application. Student records should be stored in the browser by default. Cloud synchronization, online accounts, and server-side features are not required for the initial release.

The application must be useful without internet access after its frontend assets and question data have been loaded, subject to browser storage and supported browser capabilities.

⸻

2. TECHNOLOGY STACK

Use a practical, maintainable stack.

Frontend:

* React
* TypeScript with strict mode
* Vite
* React Router, configured for GitHub Pages
* Tailwind CSS
* shadcn/ui or equivalent accessible components
* Recharts for analytics
* React Hook Form
* Zod for validation
* Motion or CSS transitions for animations
* IndexedDB for persistent local data

Use a maintained IndexedDB wrapper such as Dexie if it materially simplifies reliable database operations.

Use browser APIs only where they are supported and provide graceful fallbacks.

Avoid unnecessary dependencies.

Do not introduce:

* AI SDKs
* AI API clients
* Paid analytics services
* Paid authentication services
* Required backend services
* Remote AI-generated content
* Unnecessary external APIs

A build-time development server is acceptable. The deployed application must not require a persistent backend process.

Use a lockfile and compatible dependency versions.

⸻

3. PROJECT INITIALIZATION AND WORKFLOW

Before implementation:

1. Inspect the repository and determine whether it is empty.
2. Identify existing source files, package configuration, assets, and deployment setup.
3. If empty, initialize the project using the specified stack.
4. Write a concise implementation plan.
5. Define the data model and core calculation rules.
6. Establish a testing strategy.
7. Begin implementation without waiting for another prompt.

Work in small, verifiable stages.

Do not stop after creating the plan, dashboard design, or starter project.

After each major stage:

* Run the available checks.
* Fix discovered issues.
* Verify that existing functionality remains intact.
* Document any real limitations.

If an external service is not available, do not pretend it was configured. However, the core product must not depend on external services.

⸻

4. ZERO-COST HOSTING ARCHITECTURE

The application must be deployable to GitHub Pages.

GitHub Pages provides static hosting. Do not assume it can execute a private backend, Node.js server, or scheduled job.

Build the application as a static frontend.

Requirements:

* Configure the Vite base path correctly for a GitHub Pages project site.
* Ensure CSS, JavaScript, fonts, icons, and images load from the correct paths.
* Use a static-hosting-compatible routing strategy.
* Ensure navigation and browser refreshes work correctly.
* Avoid server-only functionality.
* Avoid hardcoded localhost URLs in production code.
* Provide GitHub Actions deployment configuration.
* Document the repository settings required for GitHub Pages.
* Do not commit credentials or unnecessary secrets.

Create a progressive web app only if it can be implemented correctly with the chosen deployment architecture.

If PWA support is included:

* Use a valid manifest.
* Configure appropriate icons.
* Use a service worker with safe cache versioning.
* Provide a proper update strategy.
* Avoid caching sensitive or stale state incorrectly.
* Ensure deployment under a repository subpath works.
* Do not claim offline support until it has been tested.

⸻

5. PREMIUM VISUAL DESIGN SYSTEM

Create a polished interface comparable to modern educational SaaS products.

Design direction:

* Clean and professional
* Modern educational dashboard
* Light mode by default
* Optional dark mode
* Warm white and neutral surfaces
* Deep navy typography
* Restrained emerald or teal accents
* Clear visual hierarchy
* Consistent spacing
* Subtle shadows and borders
* Carefully selected icons
* Readable charts
* Consistent typography

Avoid:

* Excessive gradients
* Excessive glassmorphism
* Oversized cards
* Unnecessary decorative elements
* Too many bright colors
* Excessive animations
* Fake statistics
* Fake notifications
* Placeholder buttons presented as working features

Create reusable design tokens for:

* Colors
* Typography
* Spacing
* Border radius
* Shadows
* Focus states
* Animation durations
* Z-index levels

Provide a coherent component library for cards, dialogs, buttons, form controls, navigation, progress indicators, charts, empty states, toasts, and loading skeletons.

⸻

6. RESPONSIVE APPLICATION LAYOUT

Create the following main navigation items:

1. Dashboard
2. Study Planner
3. Practice
4. Mock Tests
5. Revision
6. Performance
7. Syllabus
8. Question Bookmarks
9. Settings

Use a sidebar on larger screens and compact bottom navigation on mobile where appropriate.

The application must work on:

* Small smartphones around 320–375 CSS pixels wide
* Modern smartphones
* Tablets
* Desktop screens
* Wide displays

Requirements:

* No horizontal overflow.
* Mobile-friendly question layouts.
* Readable text and charts.
* Touch targets preferably at least 44 × 44 CSS pixels.
* Keyboard navigation.
* Visible focus indicators.
* Accessible labels and error messages.
* Responsive dialogs and bottom sheets.
* Respect mobile safe-area insets where needed.

⸻

7. DASHBOARD

Create a dashboard based entirely on actual local records.

Display:

* Questions attempted
* Overall accuracy
* Study time
* Recent mock-test scores
* Topic mastery estimates
* Weak topics
* Revision due today
* Today’s study plan
* Daily completion progress
* Syllabus coverage
* Recent activity
* Recommended next activity

Provide:

* Date filters
* Exam filters
* Useful empty states
* Loading states
* Error handling
* Explanations for calculated metrics

For a new student, show a useful onboarding dashboard rather than fabricated statistics.

Never display fake scores, ranks, percentiles, streaks, or study time.

All dashboard figures must be derived from actual data or clearly labeled sample data in a separate demo mode.

⸻

8. EXAM AND SYLLABUS MANAGEMENT

Support configurable exam families:

* SSC CGL
* SSC CHSL
* SSC MTS
* SSC GD
* Andaman & Nicobar recruitment examinations
* Other examinations added by future question-bank updates

Create a data-driven syllabus structure.

Each examination may contain:

* Exam name
* Exam cycle
* Stages
* Papers
* Sections
* Subjects
* Topics
* Subtopics
* Question counts
* Duration
* Marking rules
* Negative-marking rules
* Source references
* Syllabus version

Subjects may include:

* Quantitative Aptitude
* Reasoning
* English
* General Awareness
* Indian Polity
* History
* Geography
* Economics
* General Science
* Computer Awareness
* Current Affairs
* Vocabulary
* Idioms and Phrases
* One Word Substitution
* Grammar
* Reading Comprehension
* Exam-specific subject knowledge

Do not assume that all examinations use the same pattern.

Use configurable metadata instead of scattering exam-specific hardcoded conditions throughout the application.

Store syllabus source information where known.

Do not invent official exam patterns, eligibility criteria, notification dates, or answer keys.

Clearly mark missing or unverified information.

⸻

9. QUESTION BANK

Build a structured question bank.

Each question should support:

* Unique ID
* Exam
* Exam cycle, when applicable
* Subject
* Topic
* Subtopic
* Question type
* Language
* Question text
* Optional passage
* Answer options
* Correct answer
* Explanation
* Difficulty
* Expected solving time, when established
* Source reference, when applicable
* Verification status
* Revision version
* Created date
* Updated date

Support:

* Multiple-choice questions
* Optional numerical-answer questions
* Question images where appropriate
* Tables and passages where appropriate
* English and other supported languages as data becomes available

Verification workflow

Use the following lifecycle:

Draft → Reviewed → Approved → Published → Archived.

Only approved questions should be included in scored mock tests.

Support:

* Question editing
* Answer-key verification
* Explanation editing
* Duplicate detection
* Source tracking
* Error reports
* Version history
* Bulk CSV import
* Import preview
* Validation reports

Do not claim that an imported question is official or verified unless its provenance and review status support that claim.

Do not invent previous-year questions or official source citations.

Create a small, clearly labeled development dataset for testing. Keep it separate from the production question bank.

The application must support importing additional legally usable question data without modifying the application code.

⸻

10. QUESTION BANK IMPORT AND EXPORT

Provide a CSV import interface.

Required behavior:

* Upload a CSV file.
* Preview parsed rows.
* Validate required columns.
* Identify malformed rows.
* Identify duplicate question IDs.
* Check answer-option references.
* Validate difficulty and category fields.
* Show errors before importing.
* Allow users to cancel.
* Commit valid rows only after confirmation.
* Report successful and rejected row counts.

Provide:

* CSV export
* JSON backup
* JSON restore
* Schema validation before restore
* Confirmation before replacing or merging data
* Duplicate handling
* Error recovery

Never silently overwrite an existing question bank or delete student records during import.

Allow the student to back up personal records separately from the administrator-managed question dataset.

⸻

11. PRACTICE ENGINE

Implement the following modes:

* Topic-wise practice
* Subject-wise practice
* Mixed practice
* Weak-topic practice
* Incorrect-question practice
* Bookmarked-question practice
* Timed practice
* Untimed learning mode

Allow students to configure:

* Exam
* Subject
* Topic
* Difficulty
* Number of questions
* Time limit
* Question selection mode

For each question:

* Display the question clearly.
* Display the answer options.
* Record the selected answer.
* Provide feedback according to the selected practice mode.
* Show the reviewed explanation.
* Allow students to bookmark questions.
* Record attempt history.
* Offer similar stored questions for additional practice.

Do not reveal answers during a scored mock examination until the permitted review stage.

Avoid repeatedly presenting the same questions unless the student explicitly chooses revision or retry mode.

⸻

12. TIMED MOCK EXAMINATION ENGINE

Build a realistic examination interface.

Required features:

* Full-length mock tests
* Sectional tests
* Configurable examination patterns
* Configurable time limits
* Question navigation
* Answered and unanswered indicators
* Mark-for-review status
* Previous and next navigation
* Final submission confirmation
* Automatic submission at timeout
* Score calculation
* Detailed result review
* Topic-wise performance
* Correct, incorrect, and unanswered counts

Support exam-specific marking rules.

For a conventional multiple-choice examination:

Score = correct answers × marks per correct answer − incorrect answers × negative marks per incorrect answer.

Keep the scoring engine independent of the UI.

Test:

* All answers correct
* All answers incorrect
* All questions unanswered
* Mixed answers
* Fractional negative marks
* Section-specific marking
* Timer expiration
* Interrupted tests
* Duplicate submissions
* Page refresh during a test
* Navigation away from an active test

Persist mock-test progress locally when supported.

Use a defensible timer based on elapsed time and stored attempt state rather than trusting only a displayed countdown.

Document the limitation that local browser storage is not tamper-proof and does not provide the security guarantees of a server-controlled examination.

⸻

13. DETERMINISTIC ADAPTIVE LEARNING

This module replaces all AI-based personalization.

Create a documented, deterministic recommendation engine.

Analyze:

* Accuracy by topic
* Number of attempts
* Recent errors
* Repeated mistakes
* Question difficulty
* Average solving time
* Last practice date
* Revision backlog
* Syllabus coverage

Calculate topic mastery using transparent rules.

Do not assign a strong weakness label based on a single incorrect answer.

Use minimum sample sizes and confidence labels.

For example:

* Insufficient data
* Needs more practice
* Developing
* Improving
* Strong

Define the thresholds in configuration and document their meaning.

Select recommended practice using:

1. Weakness supported by sufficient evidence
2. Overdue revision
3. Repeated mistakes
4. Uncovered syllabus topics
5. Exam relevance where verified
6. Student’s available study time
7. Recent performance

Every recommendation should explain its reason.

Example:

“Practice percentages today because recent attempts show low accuracy across several questions, and this topic is included in your selected syllabus.”

Do not claim that a student’s future exam score or selection is guaranteed.

Make the recommendation engine deterministic and unit-testable.

⸻

14. PERSONALIZED STUDY PLANNER

Create a daily and weekly study planner.

Inputs:

* Target examination
* Selected syllabus
* Target exam date, if known
* Available study minutes per day
* Preferred study days
* Current topic performance
* Revision backlog
* Completed tasks
* Student-selected priorities

Generate realistic tasks for:

* Concept study
* Practice questions
* Timed drills
* Error review
* Vocabulary
* Revision
* Mock tests

Every task should include:

* Topic
* Activity type
* Estimated duration
* Question count, if applicable
* Priority
* Completion status
* Recommendation reason

Features:

* Generate daily plans
* Generate weekly plans
* Edit tasks
* Reorder tasks
* Mark tasks complete
* Skip tasks
* Reschedule incomplete work
* Track planned versus actual time
* Update future recommendations after new attempts

Do not use an AI service to create study plans.

Use a deterministic scheduling algorithm that respects available study time and avoids generating unrealistic workloads.

⸻

15. SPACED REPETITION

Build a revision scheduler for:

* Vocabulary
* Idioms
* One Word Substitution
* Grammar
* Indian Polity
* General Awareness
* Incorrect questions
* Bookmarked questions

Use a documented spaced-repetition algorithm.

Track:

* Last review date
* Next review date
* Review count
* Successful recalls
* Failed recalls
* Current interval
* Review history

Use a tested SM-2-style approach or another documented deterministic algorithm.

A failed recall should generally bring an item back sooner. Successful recall should extend the review interval according to the chosen algorithm.

Provide:

* Due today
* Overdue
* Upcoming
* Review session
* Flashcard mode
* Multiple-choice recall
* Review summary

Do not mark an item mastered merely because it was opened.

All revision logic must work without external services.

⸻

16. STUDY CONTENT AND EXPLANATIONS

Use stored content, not generative AI.

Provide:

* Reviewed answer explanations
* Mathematical solutions
* Reasoning explanations
* English grammar rules
* Vocabulary meanings
* Example sentences
* Idiom explanations
* Polity notes
* General Awareness facts
* Source references

For mathematical questions, support structured solution steps when supplied in the question bank.

If an explanation is missing, show:

“Explanation not available yet. This question requires review.”

Never invent an explanation or substitute an unverified answer.

Allow students to maintain private notes and bookmarks.

Keep notes and learning records in local storage.

⸻

17. PERFORMANCE ANALYTICS

Create meaningful, data-driven reports.

Include:

* Overall accuracy
* Accuracy by subject
* Accuracy by topic
* Recent versus historical accuracy
* Time per question
* Correct and incorrect answers
* Unanswered questions
* Mock-test score history
* Study time by day and week
* Syllabus coverage
* Revision completion
* Frequently repeated errors
* Improvement or decline over time

Distinguish:

* Accuracy from percentage score
* Raw marks from normalized scores
* Observed results from estimates
* Personal performance from rank or percentile

Do not display a rank or percentile unless there is a real, defined comparison cohort.

When sample size is small, label the results as provisional.

All charts must use actual stored data and update when filters change.

Support date filters, exam filters, responsive charts, and data export.

⸻

18. VOCABULARY AND DAILY REVISION MODULE

Include a dedicated English revision area for SSC preparation.

Support:

* Daily vocabulary
* English definitions
* Telugu meanings where available
* Synonyms and antonyms
* Example sentences
* Idioms and phrases
* One Word Substitution
* Grammar rules
* Revision flashcards
* Topic-wise quizzes
* Bookmarking
* Review scheduling

Support configurable content packs.

Do not invent official exam provenance.

Allow new vocabulary packs and study content to be imported from reviewed CSV or JSON datasets.

⸻

19. CURRENT AFFAIRS AND INDIAN POLITY

Provide structured content sections for current affairs and constitutional topics.

Every content item should support:

* Title or question
* Explanation
* Source
* Publication date, where relevant
* Topic tags
* Verification status
* Review date

Do not automatically invent daily news or current-affairs updates.

For the zero-cost version, provide:

* Manually maintained content packs
* Importable datasets
* Source links
* Clear publication dates
* Review status

For Indian Constitution articles, store article numbers, titles, explanations, and source references.

Distinguish constitutional text from simplified educational explanations.

Do not claim that current-affairs content is current unless it has been checked against an appropriate source.

⸻

20. REALISTIC ANIMATIONS

Implement a consistent and restrained animation system.

Use CSS transitions and a compatible animation library only where appropriate.

Required interactions:

* Page navigation transitions
* Smooth dialog opening and closing
* Subtle button press feedback
* Smooth chart entrance
* Progress-bar transitions
* Transaction-like list entrance for new study activity
* Question-state transitions
* Toast notifications
* Loading skeletons
* Theme transitions

Use appropriate short durations, generally around 150–250 milliseconds for micro-interactions.

Avoid:

* Excessive bouncing
* Constant animated backgrounds
* Unnecessary parallax
* Distracting movement during examinations
* Delaying score calculations or submissions
* Animating fake statistics
* Heavy animations on low-end devices

Respect the prefers-reduced-motion setting.

Ensure animations do not interfere with keyboard navigation, accessibility, timers, or answer submission.

⸻

21. LOCAL DATA ARCHITECTURE

Use IndexedDB as the primary local database.

Store:

* Student preferences
* Exam selection
* Study plans
* Tasks
* Question attempts
* Mock-test history
* Bookmarks
* Notes
* Revision history
* Local settings

Create a documented data schema and versioned migration system.

Requirements:

* Unique IDs
* Indexed queries for frequent operations
* Transactional updates where necessary
* Safe handling of malformed records
* Migration error handling
* Data export
* Data restore
* Storage quota error handling
* Duplicate prevention
* Recovery instructions

Never clear the entire database during application startup.

Never silently overwrite existing user data.

Do not store passwords or claim that browser-local records are encrypted.

Explain that clearing browser data or losing a device may cause data loss unless the student has exported a backup.

Do not claim automatic synchronization across devices.

⸻

22. IMPORTABLE QUESTION DATA

Create a documented question-bank JSON format.

Each question should support:

* ID
* Exam code
* Subject
* Topic
* Question type
* Language
* Question text
* Options
* Correct answer
* Explanation
* Difficulty
* Source metadata
* Verification status

Include:

* JSON schema
* Example dataset
* Validation utility
* CSV-to-question-bank import process
* Error report
* Duplicate detection
* Versioning strategy

Keep the sample dataset small and clearly labeled.

Do not fabricate a large question bank to make the application look complete.

Make it easy to add legally usable, verified questions later without changing the frontend code.

⸻

23. ACCESSIBILITY AND USABILITY

Aim for WCAG 2.2 AA practices.

Requirements:

* Semantic HTML
* Keyboard navigation
* Visible focus states
* Screen-reader labels
* Accessible forms
* Error messages linked to controls
* Sufficient contrast
* Reduced-motion support
* Accessible chart summaries
* Responsive layouts
* Appropriate touch targets
* Clear confirmation for destructive actions

Make timed examinations usable on mobile devices.

Do not use color alone to indicate answered, incorrect, or correct states.

⸻

24. PERFORMANCE OPTIMIZATION

Optimize the application for mobile devices and ordinary internet connections.

Use:

* Route-based code splitting
* Lazy loading where appropriate
* Efficient IndexedDB queries
* Memoization where justified
* Responsive chart rendering
* Minimal frontend dependencies
* Optimized assets
* Efficient question rendering

Avoid:

* Unnecessary network requests
* Polling
* Large dependencies without justification
* Recalculating all historical analytics on every keystroke
* Blocking UI during long calculations

Measure the production build and document actual results.

Do not claim performance scores that have not been measured.

⸻

25. TESTING REQUIREMENTS

Use:

* Vitest
* React Testing Library
* Playwright where browser testing is available
* TypeScript strict checks
* ESLint
* Production build validation

Write unit tests for:

* Scoring
* Negative marking
* Topic accuracy
* Mastery estimation
* Study-plan scheduling
* Revision intervals
* Date boundaries
* Time calculations
* Question validation
* Duplicate detection
* Import validation
* Data migrations

Write integration tests for:

* Creating and editing tasks
* Recording attempts
* Completing mock tests
* Calculating results
* Updating analytics
* Adding bookmarks
* Completing revision sessions
* Exporting and restoring backups

Write end-to-end tests for:

1. A new student opens the application.
2. The student selects an examination.
3. The student starts a practice session.
4. The student answers questions.
5. The system records the attempt.
6. The dashboard updates.
7. The planner recommends a suitable task.
8. The student completes revision.
9. The student takes a mock examination.
10. The score and review screen are correct.
11. The student exports a backup.
12. The backup is validated and restored.

Test application behavior with an empty database and with malformed stored data.

Run tests and fix failures. Do not report success for tests that were not run.

⸻

26. GITHUB PAGES DEPLOYMENT

Create a GitHub Actions workflow that:

* Installs dependencies from the lockfile.
* Runs linting.
* Runs TypeScript checks.
* Runs unit tests.
* Runs the production build.
* Publishes the built frontend to GitHub Pages after successful checks.

Document:

* Repository setup
* GitHub Pages configuration
* Repository base path
* Build command
* Deployment workflow
* Local development command
* Browser compatibility
* Backup and restoration
* Updating question datasets
* Troubleshooting common deployment errors

Verify that internal navigation, asset loading, IndexedDB, and PWA functionality where implemented work at the deployed repository URL.

Do not require any secret API keys for the application to run.

⸻

27. FINAL DELIVERABLES

Produce:

1. Complete React and TypeScript source code.
2. Responsive design system.
3. Dashboard.
4. Question bank.
5. Practice engine.
6. Timed mock-test engine.
7. Deterministic scoring.
8. Adaptive-learning algorithm.
9. Personalized study planner.
10. Spaced-repetition scheduler.
11. Performance analytics.
12. Vocabulary revision module.
13. Current-affairs and Polity content framework.
14. IndexedDB data layer.
15. Import and export functionality.
16. Data migration system.
17. Unit and integration tests.
18. End-to-end tests where available.
19. GitHub Actions workflow.
20. GitHub Pages deployment instructions.
21. README.
22. Question-bank data schema.
23. Known limitations and future improvements.

⸻

28. DEFINITION OF DONE

The project is complete only when:

* No generative AI provider is integrated.
* No AI API key is required.
* No AI API requests are made.
* No obsolete AI SDK dependency remains.
* The core application runs without a backend.
* The question bank loads and validates correctly.
* Practice attempts persist locally.
* Mock-test scores are correct.
* Negative marking works.
* Topic performance is calculated from real attempts.
* The study planner generates realistic tasks.
* Revision scheduling works.
* Charts use actual records.
* Import and export work.
* Existing user data is preserved.
* Mobile layouts work.
* Animations respect reduced-motion settings.
* GitHub Pages deployment is correctly configured.
* Tests and production builds have actually run.
* Limitations are documented honestly.

Do not confuse a visually complete screen with a functioning feature.

If content is missing, provide an import mechanism rather than fabricating it.

If an environment limitation prevents a test, report it explicitly.

⸻

29. EXECUTION COMMAND

Start immediately.

First inspect the repository and provide a concise audit and implementation plan. Then build the actual application in phases.

Do not ask me to repeat this specification.

Do not stop after the planning phase.

Do not introduce AI under another name.

Do not require paid services or API credentials.

Do not fabricate exam questions, official information, test results, or completed features.

Prioritize exam accuracy, useful learning algorithms, data integrity, accessibility, responsive design, realistic animations, and dependable GitHub Pages deployment.

Deliver a working, maintainable, zero-AI-cost Smart Exam Coach that students can use for free.