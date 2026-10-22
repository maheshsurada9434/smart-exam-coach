# RESUME GUIDE (read this first in any new session)

This project is built in day-wise stages. If a session ends (token limit, crash, new chat),
**never restart from the beginning**. Continue from the first unchecked task.

## Resume protocol (for Claude)
1. Read `RESUME.md` (this file), then `PROGRESS.md`.
2. Find the first unchecked `[ ]` task in `PROGRESS.md`. If a task is marked `[~]` (in progress),
   inspect its files, finish it, and verify it before moving on.
3. Read `docs/SPEC.md` only for the sections the current task needs (spec section numbers are in PLAN.md).
4. Run `npm install` if `node_modules` is missing, then run the checks listed for that day in `PLAN.md`.
5. Do NOT recreate files that already exist. Read them and extend them.
6. After every finished task: tick it in `PROGRESS.md`, add a line to the "Session log", and `git commit`.
7. Before a day is marked done, run its checks. Never tick a task that was not actually verified.

## 70% token stop rule
- Budget = the `total_tokens ... left` counter shown in the session (started at 15,000,000).
- When 70% is used (4,500,000 or fewer left): finish only the file currently being edited,
  update PROGRESS.md (set the unfinished task to `[~]` and write what is left), commit,
  then STOP and tell the user: "70% token limit reached, stopping. Resume from PROGRESS.md."
- Do not start any new task after this point.
- Claude cannot see the account's weekly limit; the user should check Settings > Usage for that.
- Weekly baseline: 29% used on Thu 22 Oct 2026 11:25 (resets Mon 10:30 PM). Hard stop when the user
  reports weekly usage at 70%. At the start of each session, ask the user for the current weekly %.
  If it is already 70% or more, do not start any work.

## Rules that never change
- No AI/LLM/API anywhere in the app. No paid services. No backend. No fabricated questions or exam facts.
- Honest reporting: say what was run and what was not.

## Files
- `docs/SPEC.md`  full product specification (source of truth)
- `PLAN.md`       day-wise plan with checks per day
- `PROGRESS.md`   checklist and session log (the resume pointer)
