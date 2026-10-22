# Study content packs

Vocabulary, idioms, one-word substitution, grammar, Indian Polity, current affairs and GA facts are loaded from
content packs: **Syllabus or Revision → Study content → Import a content pack**. The app never writes or invents content.
Content is admin data (like the question bank) and is not part of the student backup; export it from the same page.

## JSON
```json
{ "format": "smart-exam-coach-content", "version": 1, "pack": { "id": "ssc-vocab-1" },
  "items": [ { "id": "V-001", "kind": "word", "front": "Lucid", "back": "Clear and easy to understand",
               "telugu": "…", "synonyms": ["Clear"], "antonyms": ["Obscure"], "examples": ["…"],
               "source": { "label": "…", "url": "https://…" }, "verification": "reviewed" } ] }
```

## CSV
Template: `public/templates/content-template.csv`. Required columns: `id, pack, kind, front, back`.
Lists (`synonyms`, `antonyms`, `examples`, `tags`) are joined with `|`.

| Field | Meaning |
|---|---|
| kind | `word`, `idiom`, `ows`, `grammar`, `polity`, `current-affairs`, `ga-fact` |
| front / back | word → meaning; idiom → meaning; ows: definition → the word; grammar: rule name → rule; polity: article title → text or explanation |
| telugu | Telugu meaning, where available |
| article, text_type | Polity: article number; `constitutional-text` or `simplified` (**required** for polity) |
| published_on | Current affairs: publication date, **required**, `YYYY-MM-DD` |
| source_label / source_url | **Required** for current affairs and for `verified` items |
| reviewed_on | Date the item was last checked |
| verification | `unverified` (default), `reviewed`, `verified` |

## Rules
- Duplicate IDs in a file, and the same entry (same kind + front + language) under another ID, are rejected.
- Rows whose ID is already stored are skipped unless "Update entries that are already stored" is ticked.
- Current affairs are never updated automatically and always show their date and source.
- Quizzes use only stored answers: the correct one plus three other stored answers of the same kind (needs 4+ entries).
- "Add to revision" schedules items with the same SM-2 rules as questions (docs/ALGORITHMS.md).
