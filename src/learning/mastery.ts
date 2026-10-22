// Topic mastery from real attempts, using fixed, documented thresholds (see docs/ALGORITHMS.md).

export const MASTERY = {
  minAttempts: 5, // below this: "Insufficient data", never "weak"
  recentWindow: 10, // "recent accuracy" = the last 10 attempts of the topic
  strongMinAttempts: 10,
  strongAccuracy: 0.8,
  developingAccuracy: 0.6,
  improvingDelta: 0.15, // recent beats earlier attempts by 15 points …
  improvingMinEarlier: 5, // … and there are at least 5 earlier attempts to compare with
  repeatedMistake: 2, // a question answered wrongly this many times is a repeated mistake
}

export const LABELS = ['insufficient', 'needs-practice', 'developing', 'improving', 'strong'] as const
export type MasteryLabel = (typeof LABELS)[number]
export const LABEL_TEXT: Record<MasteryLabel, string> = {
  insufficient: 'Insufficient data',
  'needs-practice': 'Needs more practice',
  developing: 'Developing',
  improving: 'Improving',
  strong: 'Strong',
}

export type MasteryAttempt = {
  questionId: string
  topic: string
  subject?: string
  correct: boolean
  createdAt: string
  timeMs?: number
}

export type TopicMastery = {
  topic: string
  subject: string
  attempts: number
  correct: number
  accuracy: number
  recentAccuracy: number
  earlierAccuracy: number | null
  label: MasteryLabel
  confidence: 'low' | 'medium' | 'high' | 'none'
  lastPracticed: string
  avgTimeMs: number | null
  repeatedMistakes: number // distinct questions wrong at least MASTERY.repeatedMistake times
}

const ratio = (xs: MasteryAttempt[]) => (xs.length ? xs.filter((a) => a.correct).length / xs.length : 0)

export function labelFor(attempts: number, recent: number, earlier: number | null, earlierCount: number, c = MASTERY): MasteryLabel {
  if (attempts < c.minAttempts) return 'insufficient'
  if (attempts >= c.strongMinAttempts && recent >= c.strongAccuracy) return 'strong'
  if (earlier !== null && earlierCount >= c.improvingMinEarlier && recent - earlier >= c.improvingDelta) return 'improving'
  if (recent >= c.developingAccuracy) return 'developing'
  return 'needs-practice'
}

export function topicMastery(all: MasteryAttempt[], c = MASTERY): TopicMastery[] {
  const byTopic = new Map<string, MasteryAttempt[]>()
  for (const a of all) byTopic.set(a.topic, [...(byTopic.get(a.topic) ?? []), a])
  return [...byTopic].map(([topic, list]) => {
    const sorted = [...list].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
    const recent = sorted.slice(-c.recentWindow)
    const earlierList = sorted.slice(0, -c.recentWindow)
    const earlier = earlierList.length ? ratio(earlierList) : null
    const times = sorted.map((a) => a.timeMs).filter((t): t is number => typeof t === 'number' && t > 0)
    const wrongCount = new Map<string, number>()
    for (const a of sorted) if (!a.correct) wrongCount.set(a.questionId, (wrongCount.get(a.questionId) ?? 0) + 1)
    const n = sorted.length
    return {
      topic,
      subject: sorted.find((a) => a.subject)?.subject ?? '',
      attempts: n,
      correct: sorted.filter((a) => a.correct).length,
      accuracy: ratio(sorted),
      recentAccuracy: ratio(recent),
      earlierAccuracy: earlier,
      label: labelFor(n, ratio(recent), earlier, earlierList.length, c),
      confidence: n < c.minAttempts ? 'none' : n < 10 ? 'low' : n < 20 ? 'medium' : 'high',
      lastPracticed: sorted[n - 1]!.createdAt,
      avgTimeMs: times.length ? Math.round(times.reduce((s, t) => s + t, 0) / times.length) : null,
      repeatedMistakes: [...wrongCount.values()].filter((v) => v >= c.repeatedMistake).length,
    }
  })
}

export const weakTopicNames = (all: MasteryAttempt[]) =>
  topicMastery(all)
    .filter((t) => t.label === 'needs-practice')
    .map((t) => t.topic)
