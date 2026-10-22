import { Check, X } from 'lucide-react'
import { MISSING_EXPLANATION, isCorrect, type Response } from '../practice/engine'
import { OPTION_LETTERS, type Question } from '../questions/schema'

type Props = {
  q: Question
  response: Response
  onChange?: (r: Response) => void
  locked?: boolean
  reveal?: boolean // show correct answer + explanation
}

export default function QuestionView({ q, response, onChange, locked, reveal }: Props) {
  const correct = reveal && isCorrect(q, response)
  return (
    <div>
      {q.source.kind === 'dev-sample' && (
        <p className="mb-2 inline-block rounded border border-warning px-1.5 py-0.5 text-xs font-medium text-warning">DEV SAMPLE</p>
      )}
      {q.source.kind === 'original' && (
        <p className="mb-2 text-xs text-muted">Original practice question · not expert-reviewed</p>
      )}
      {q.passage && <div className="mb-4 whitespace-pre-line rounded-md bg-surface-2 p-4 text-sm leading-relaxed">{q.passage}</div>}
      <p className="whitespace-pre-line text-base font-medium leading-relaxed sm:text-lg">{q.text}</p>
      {q.image && <img src={q.image} alt="Figure for this question" className="mt-3 max-h-80 max-w-full rounded-md border border-border" />}

      {q.type === 'mcq' ? (
        <fieldset className="mt-4 space-y-2" disabled={locked}>
          <legend className="sr-only">Options</legend>
          {q.options.map((opt, i) => {
            const chosen = response === i
            const isAnswer = reveal && i === q.correctOption
            const wrongChoice = reveal && chosen && !isAnswer
            return (
              <label
                key={i}
                className={[
                  'relative flex min-h-12 cursor-pointer items-center gap-3 rounded-md border px-4 py-2 text-[15px] transition-colors duration-fast focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--color-focus)]',
                  isAnswer ? 'border-success bg-surface' : wrongChoice ? 'border-danger bg-surface' : chosen ? 'border-accent bg-accent-soft' : 'border-border bg-surface hover:bg-surface-2',
                  locked ? 'cursor-default' : '',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-default"
                  checked={chosen}
                  onChange={() => onChange?.(i)}
                />
                <span
                  aria-hidden
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-semibold transition-colors duration-fast ${chosen ? 'border-accent bg-accent text-accent-ink' : 'border-border bg-surface-2'}`}
                >
                  {OPTION_LETTERS[i]}
                </span>
                <span className="sr-only">{OPTION_LETTERS[i]}.</span>
                <span className="flex-1">{opt}</span>
                {isAnswer && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                    <Check size={16} aria-hidden /> Correct answer
                  </span>
                )}
                {wrongChoice && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-danger">
                    <X size={16} aria-hidden /> Your answer
                  </span>
                )}
              </label>
            )
          })}
        </fieldset>
      ) : (
        <label className="mt-4 block text-sm font-medium">
          Your answer
          <input
            type="number"
            inputMode="decimal"
            step="any"
            disabled={locked}
            className="mt-1 block min-h-11 w-full max-w-xs rounded-md border border-border bg-surface px-3 text-base"
            value={response === null || !Number.isFinite(response) ? '' : response}
            onChange={(e) => onChange?.(e.target.value === '' ? null : Number(e.target.value))}
          />
        </label>
      )}

      {reveal && (
        <div className="animate-pop mt-4 rounded-md border border-border bg-surface-2 p-4 text-sm" role="status">
          <p className={`flex items-center gap-1.5 font-semibold ${response === null ? 'text-muted' : correct ? 'text-success' : 'text-danger'}`}>
            {response === null ? 'Not answered' : correct ? <><Check size={16} aria-hidden /> Correct</> : <><X size={16} aria-hidden /> Incorrect</>}
            {q.type === 'numerical' && <span className="font-normal text-ink">· Answer: {q.correctValue}{q.tolerance ? ` (±${q.tolerance})` : ''}</span>}
          </p>
          <p className="mt-2 whitespace-pre-line">{q.explanation || MISSING_EXPLANATION}</p>
          {q.solutionSteps.length > 0 && (
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              {q.solutionSteps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          )}
          {q.source.label && <p className="mt-2 text-xs text-muted">Source: {q.source.label}{q.source.year ? ` (${q.source.year})` : ''}</p>}
        </div>
      )}
    </div>
  )
}
