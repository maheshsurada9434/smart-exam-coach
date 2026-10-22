import { KIND_LABEL, type ContentItem } from '../content/schema'

export default function ContentItemView({ c }: { c: ContentItem }) {
  return (
    <div className="text-sm">
      <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <span>{KIND_LABEL[c.kind]}</span>
        {c.article && <span>· Article {c.article}</span>}
        {c.textType && <span className="rounded bg-surface-2 px-1.5 py-0.5">{c.textType === 'constitutional-text' ? 'Constitutional text' : 'Simplified explanation'}</span>}
        <span className={`rounded border px-1.5 py-0.5 ${c.verification === 'verified' ? 'border-success text-success' : c.verification === 'reviewed' ? 'border-border' : 'border-warning text-warning'}`}>
          {c.verification}
        </span>
        {c.pack === 'dev-sample' && <span className="rounded border border-warning px-1.5 py-0.5 font-medium text-warning">DEV SAMPLE</span>}
      </p>
      <p className="mt-1 text-base font-semibold">{c.front}</p>
      <p className="mt-1">{c.back}</p>
      {c.telugu && <p className="mt-1 text-muted" lang="te">తెలుగు: {c.telugu}</p>}
      {c.synonyms.length > 0 && <p className="mt-1 text-muted">Synonyms: {c.synonyms.join(', ')}</p>}
      {c.antonyms.length > 0 && <p className="text-muted">Antonyms: {c.antonyms.join(', ')}</p>}
      {c.examples.map((x) => (
        <p key={x} className="mt-1 italic text-muted">
          “{x}”
        </p>
      ))}
      {(c.source.label || c.source.url || c.publishedOn) && (
        <p className="mt-1 text-xs text-muted">
          {c.publishedOn && `Published ${c.publishedOn} · `}
          {c.reviewedOn && `Reviewed ${c.reviewedOn} · `}
          {c.source.url ? (
            <a className="text-accent underline" href={c.source.url} target="_blank" rel="noreferrer">
              {c.source.label ?? 'Source'}
            </a>
          ) : (
            c.source.label
          )}
        </p>
      )}
    </div>
  )
}
