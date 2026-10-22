// Deterministic recommendations. Each one carries the reason it was made.
import type { TopicMastery } from './mastery'

export type RecKind = 'weak-topic' | 'revision' | 'error-review' | 'new-topic' | 'drill' | 'mock'
export type Recommendation = {
  kind: RecKind
  rank: number // lower = more important; follows the order in docs/ALGORITHMS.md
  topic?: string
  subject?: string
  count?: number
  reason: string
}

export type RecInput = {
  mastery: TopicMastery[]
  revisionDue: number // due today + overdue
  revisionOverdue: number
  /** Syllabus topics of the chosen exam that have published questions, with their counts. */
  practisable: { topic: string; subject: string; questions: number }[]
  daysSinceMock: number | null // null = never
  canMock: boolean // approved/published questions exist for the exam
  daysToExam: number | null
}

const pct = (x: number) => `${Math.round(x * 100)}%`

export function recommend(i: RecInput): Recommendation[] {
  const out: Recommendation[] = []
  const has = new Map(i.practisable.map((p) => [p.topic, p]))

  // 1. Weakness backed by enough attempts
  for (const t of i.mastery.filter((m) => m.label === 'needs-practice' && has.has(m.topic)).sort((a, b) => a.recentAccuracy - b.recentAccuracy))
    out.push({
      kind: 'weak-topic',
      rank: 1,
      topic: t.topic,
      subject: t.subject,
      reason: `Practise ${t.topic}: your last ${Math.min(t.attempts, 10)} attempts were ${pct(t.recentAccuracy)} correct (${t.attempts} attempts in total).`,
    })

  // 2. Overdue / due revision
  if (i.revisionDue > 0)
    out.push({
      kind: 'revision',
      rank: 2,
      count: i.revisionDue,
      reason:
        i.revisionOverdue > 0
          ? `${i.revisionOverdue} revision item${i.revisionOverdue === 1 ? ' is' : 's are'} overdue; reviewing on time keeps the intervals short.`
          : `${i.revisionDue} revision item${i.revisionDue === 1 ? ' is' : 's are'} due today.`,
    })

  // 3. Repeated mistakes
  for (const t of i.mastery.filter((m) => m.repeatedMistakes > 0 && has.has(m.topic)).sort((a, b) => b.repeatedMistakes - a.repeatedMistakes))
    out.push({
      kind: 'error-review',
      rank: 3,
      topic: t.topic,
      subject: t.subject,
      reason: `Review mistakes in ${t.topic}: ${t.repeatedMistakes} question${t.repeatedMistakes === 1 ? ' was' : 's were'} answered wrongly more than once.`,
    })

  // 4. Syllabus topics not practised yet
  const seen = new Set(i.mastery.map((m) => m.topic))
  for (const p of i.practisable.filter((p) => !seen.has(p.topic)))
    out.push({
      kind: 'new-topic',
      rank: 4,
      topic: p.topic,
      subject: p.subject,
      reason: `Start ${p.topic}: it is in your exam's syllabus and you have not practised it yet (${p.questions} question${p.questions === 1 ? '' : 's'} available).`,
    })

  // 5. Recent performance: keep developing / improving topics moving
  for (const t of i.mastery.filter((m) => (m.label === 'developing' || m.label === 'improving') && has.has(m.topic)).sort((a, b) => a.recentAccuracy - b.recentAccuracy))
    out.push({
      kind: 'drill',
      rank: 5,
      topic: t.topic,
      subject: t.subject,
      reason: `Timed drill on ${t.topic}: recent accuracy is ${pct(t.recentAccuracy)}; timed practice builds exam speed.`,
    })

  // 6. Mock test cadence (more often close to the exam)
  const every = i.daysToExam !== null && i.daysToExam <= 30 ? 3 : 7
  if (i.canMock && (i.daysSinceMock === null || i.daysSinceMock >= every))
    out.push({
      kind: 'mock',
      rank: 6,
      reason:
        i.daysSinceMock === null
          ? 'Take a mock test to see how you do under exam conditions.'
          : `Your last mock test was ${i.daysSinceMock} days ago${every === 3 ? ' and your exam is within 30 days' : ''}.`,
    })

  return out
}
