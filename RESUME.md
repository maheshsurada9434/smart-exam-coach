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

## Rules that never change
- No AI/LLM/API anywhere in the app. No paid services. No backend. No fabricated questions or exam facts.
- Honest reporting: say what was run and what was not.

## Files
- `docs/SPEC.md`  full product specification (source of truth)
- `PLAN.md`       day-wise plan with checks per day
- `PROGRESS.md`   checklist and session log (the resume pointer)
