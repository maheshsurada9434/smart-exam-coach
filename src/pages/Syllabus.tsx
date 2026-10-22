import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ExternalLink } from 'lucide-react'
import { Card, EmptyState } from '../components/ui'
import VerificationBadge from '../components/VerificationBadge'
import {
  EXAMS,
  SUBJECTS,
  SYLLABUS,
  SYLLABUS_VERIFICATION,
  SYLLABUS_VERSION,
  examByCode,
  paperQuestions,
  paperTotalMarks,
} from '../data/exams'
import { getPrefs } from '../db/prefs'

export default function Syllabus() {
  const saved = useLiveQuery(() => getPrefs())
  const [picked, setPicked] = useState<string | null>(null)
  const exam = examByCode(picked ?? saved?.prefs.examCode) ?? EXAMS[0]!
  const subjects = SUBJECTS.filter((sub) => exam.papers.some((p) => p.sections.some((x) => x.subject === sub)))

  return (
    <section>
      <h1 className="text-2xl font-semibold">Syllabus</h1>
      <div role="tablist" aria-label="Exam" className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {EXAMS.map((e) => (
          <button
            key={e.code}
            role="tab"
            type="button"
            aria-selected={e.code === exam.code}
            onClick={() => setPicked(e.code)}
            className={`min-h-11 shrink-0 rounded-md border px-3 text-sm font-medium transition duration-fast ${
              e.code === exam.code ? 'border-accent bg-accent-soft text-accent' : 'border-border bg-surface text-muted hover:text-ink'
            }`}
          >
            {e.name}
          </button>
        ))}
      </div>

      <Card className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">{exam.name}</h2>
          <VerificationBadge value={exam.verification} />
        </div>
        <p className="mt-2 text-sm text-muted">{exam.note}</p>
        {exam.sources.length > 0 && (
          <ul className="mt-2 text-sm">
            {exam.sources.map((src) => (
              <li key={src.url}>
                <a href={src.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent underline">
                  {src.label} <ExternalLink size={12} aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {exam.papers.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="No exam pattern added">{exam.note}</EmptyState>
        </div>
      ) : (
        exam.papers.map((p) => (
          <Card key={p.name} className="mt-4 overflow-x-auto">
            <h3 className="font-semibold">
              {p.name} · {paperQuestions(p)} questions · {paperTotalMarks(p)} marks · {p.durationMin} min
            </h3>
            <table className="mt-3 w-full min-w-[480px] text-left text-sm">
              <thead className="text-muted">
                <tr>
                  <th className="py-2 font-medium">Section</th>
                  <th className="py-2 font-medium">Questions</th>
                  <th className="py-2 font-medium">Marks each</th>
                  <th className="py-2 font-medium">Wrong answer</th>
                </tr>
              </thead>
              <tbody>
                {p.sections.map((x) => (
                  <tr key={x.name} className="border-t border-border">
                    <td className="py-2">{x.name}</td>
                    <td className="py-2">{x.questions}</td>
                    <td className="py-2">+{x.marksPerCorrect}</td>
                    <td className="py-2">{x.negativePerWrong ? `−${x.negativePerWrong}` : 'No negative'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ))
      )}

      {subjects.length > 0 && (
        <>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Topics</h2>
            <span className="flex items-center gap-3 text-xs text-muted">
              Syllabus {SYLLABUS_VERSION} <VerificationBadge value={SYLLABUS_VERIFICATION} />
            </span>
          </div>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {subjects.map((sub) => (
              <Card key={sub}>
                <h3 className="font-semibold">{sub}</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {SYLLABUS[sub].map((t) => (
                    <li key={t} className="rounded-md bg-surface-2 px-2 py-1 text-xs">
                      {t}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
