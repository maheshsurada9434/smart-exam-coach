# Learning algorithms

Everything is deterministic and runs in the browser. No AI, no external service. Thresholds live in code
(`src/learning/mastery.ts` `MASTERY`, `src/learning/planner.ts` `PLAN`) and are listed here.

## Topic mastery (`mastery.ts`)
Per topic, from every practice and mock attempt:
- **Recent accuracy** = correct share of the last **10** attempts. **Earlier accuracy** = attempts before those.
- Labels, checked in this order:

| Label | Rule |
|---|---|
| Insufficient data | fewer than **5** attempts (a single wrong answer never makes a topic weak) |
| Strong | at least **10** attempts and recent accuracy **≥ 80%** |
| Improving | at least **5** earlier attempts and recent accuracy at least **15 points** above earlier |
| Developing | recent accuracy **≥ 60%** |
| Needs more practice | otherwise (recent accuracy below 60%) |

- **Confidence**: none (<5 attempts), low (5–9), medium (10–19), high (20+).
- **Repeated mistake**: a question answered wrongly **2+** times.
- "Weak topic" everywhere in the app means the label *Needs more practice*.

## Recommendations (`recommend.ts`)
Only topics of the chosen exam that have published questions are recommended. Order:
1. Weak topics (lowest recent accuracy first)
2. Revision due today or overdue
3. Topics with repeated mistakes
4. Syllabus topics not practised yet
5. Developing / improving topics → timed drill
6. A mock test if none in the last **7** days (**3** days when the exam date is within 30 days)

Exam-pattern "relevance" is not used as a weight because the stored patterns are not yet verified against the
official notifications. Every recommendation shows its reason. Nothing predicts or guarantees an exam result.

## Study planner (`planner.ts`)
- Budget = daily study minutes from Settings. Non-study days get no tasks.
- Task sizes: practice 10 questions = 15 min (1.5 min/question; 5-question version = 8 min), concept study 15 min,
  error review 10 min, timed drill 10 questions = 12 min, revision = 1 min per due item (5–20 min), mock 60 min.
- Recommendations are taken in order; if a task does not fit, its smaller version is tried, otherwise it is skipped.
  **The total never exceeds the budget.** One block per topic per day.
- Weekly plans rotate topic recommendations by day so days differ; revision is planned only for today
  (future due counts change with reviews); at most one mock per generated range.
- Regenerating replaces only *pending auto-generated* tasks. Done, skipped, edited and manually added tasks are kept,
  and their minutes are subtracted from the budget.
- Unfinished tasks from earlier days can be moved to today. Planned vs actual minutes are shown per day.

## Spaced repetition (`sm2.ts`) — SM-2
Grades map to SM-2 quality: Again = 1, Hard = 3, Good = 4, Easy = 5. In multiple-choice recall a wrong answer is graded 1.
- EF' = max(1.3, EF + 0.1 − (5 − q)(0.08 + (5 − q)·0.02)), starting at 2.5, updated on every review.
- q < 3 (failed recall): repetitions reset to 0, interval 1 day.
- q ≥ 3: repetitions + 1; interval 1 day, then 6 days, then round(previous interval × EF).
- Due date = review date + interval. Buckets: overdue (before today), due today, upcoming.
- Items: questions whose latest attempt was wrong, and bookmarked questions (added automatically, never duplicated).
- An item is "mature" only at an interval of 21+ days; opening an item changes nothing.
