# Local data

All student data is stored in the browser's IndexedDB (database `smart-exam-coach`), via Dexie.
It is not encrypted and not synced. Clearing site data or losing the device deletes it unless a backup was downloaded.

## Tables (schema version 2)
| Table | Key | Indexes | Holds |
|---|---|---|---|
| prefs | id (`"prefs"`) | | exam, minutes per day, study days, target date |
| questions | id | *examCodes (multi), subject, topic, status, contentKey | question bank, see QUESTIONS.md |
| questionVersions | id (`<qid>@v<n>`) | questionId | earlier versions of each question |
| attempts | id | questionId, sessionId, examCode, topic, createdAt | every answered question |
| sessions | id | kind, examCode, status, startedAt | practice and mock sessions |
| bookmarks | id (question id) | createdAt | bookmarked questions |
| notes | id | questionId, updatedAt | private notes |
| tasks | id | date, status, topic | study-plan tasks |
| revisionItems | id | kind, refId, nextReview | spaced-repetition cards |
| reviewLogs | id | itemId, reviewedAt | revision history |
| importLogs | id | createdAt | question import reports |

## Migrations
- v1 → v2: `questions.examCode` (string) became `examCodes` (array); added `contentKey` index and `questionVersions` table.
Released versions are never edited. A change adds `version(N+1).stores({...}).upgrade(tx => ...)` in `src/db/db.ts`.
The app never clears the database on startup. A malformed row is reported, not deleted.

## Student backup file (version 1)
```json
{ "app": "smart-exam-coach", "kind": "student-backup", "version": 1,
  "exportedAt": "2026-10-22T10:00:00.000Z",
  "data": { "prefs": [...], "attempts": [...], "sessions": [...], "bookmarks": [...],
            "notes": [...], "tasks": [...], "revisionItems": [...], "reviewLogs": [...] } }
```
- Every row needs a string `id`; IDs must be unique per table; unknown tables are rejected.
- **Merge** adds rows whose ID is new and keeps existing rows unchanged.
- **Replace** (asks for confirmation) clears the student tables and writes the backup in one transaction.
- The question bank is not part of this file; it has its own export (Day 3).
