# Question bank format

Questions can be added without changing app code: **Settings → Open question bank → Import questions**.
Nothing is saved until the import preview is confirmed. Existing student records are never touched.

## CSV
Template: `public/templates/questions-template.csv` (also downloadable inside the app).

| Column | Required | Notes |
|---|---|---|
| id | yes | Unique. Letters, numbers, `- _ .` (max 64) |
| exam_codes | yes | `SSC_CGL`, `SSC_CHSL`, `SSC_MTS`, `SSC_GD`, `ANI`; several joined with `\|` |
| subject | yes | `Quantitative Aptitude`, `Reasoning`, `English`, `General Awareness` |
| topic | yes | Should match a Syllabus topic (otherwise a warning) |
| type | no | `mcq` (default) or `numerical` |
| question | yes | Question text |
| option_a … option_f | mcq | 2–6 options, filled from A with no gaps |
| answer | yes | mcq: letter `A`–`F`. numerical: a number |
| tolerance | no | numerical only, accepted ± range |
| explanation | for approved/published | Never invented by the app |
| solution_steps | no | Steps joined with `\|` |
| difficulty | yes | `easy`, `medium`, `hard` |
| source_kind | yes | `original`, `previous-year`, `licensed`, `dev-sample` |
| source_label, source_year | for previous-year | Where the question really came from |
| status | yes | `draft`, `reviewed`, `approved`, `published`, `archived` |
| cycle, subtopic, language, passage, expected_seconds, source_url, image | no | |

## JSON
`{"format":"smart-exam-coach-questions","version":1,"questions":[...]}`, schema in `docs/question-bank.schema.json`.
Exported JSON can be imported again; `version`, `createdAt`, `updatedAt` are recalculated.

## Validation and duplicates
- Each row is checked; rejected rows are listed with line number and reason, and are not imported.
- Duplicate **IDs** in the same file are rejected. Rows whose ID is already stored can be skipped (default) or updated.
- Duplicate **content** (same text, same options, same language, any ID) is rejected, in the file and against the stored bank.
- Approved/published questions must have an explanation. Previous-year questions must name their source and year.

## Lifecycle and versions
`draft → reviewed → approved → published → archived` (one step forward at a time; back to draft or archive any time).
Only **approved** and **published** questions are used in scored mock tests.
Every save keeps the previous version in history. Changing the question text, options or correct answer of an
approved/published question moves it back to **reviewed**, so the new answer key is approved again.

## Versioning
`format version` changes only for breaking changes to this file format; the app will keep reading older versions.
