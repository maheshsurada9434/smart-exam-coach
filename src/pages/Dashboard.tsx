import { Card } from '../components/ui'

// New-student onboarding view. No statistics are shown until real attempts exist (Day 7).
export default function Dashboard() {
  return (
    <section>
      <p className="text-sm font-medium text-accent">Study Smarter. Practice Better. Improve Every Day.</p>
      <h1 className="mt-1 text-2xl font-semibold">Welcome to Smart Exam Coach</h1>
      <p className="mt-2 max-w-2xl text-muted">
        A free, offline-friendly coach for SSC and Andaman &amp; Nicobar recruitment exams. Your
        records stay in this browser. No AI, no accounts, no paid services.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          ['1. Choose your exam', 'Pick SSC CGL, CHSL, MTS, GD or an Andaman exam.'],
          ['2. Practise topic-wise', 'Every attempt you make builds your real performance record.'],
          ['3. Follow your plan', 'Your plan and revision come from your own results.'],
        ].map(([t, d]) => (
          <Card key={t}>
            <h2 className="font-semibold">{t}</h2>
            <p className="mt-1 text-sm text-muted">{d}</p>
          </Card>
        ))}
      </div>
      <p className="mt-6 text-sm text-muted">
        App status: these steps are being built now. Your statistics will appear here once you start
        practising.
      </p>
    </section>
  )
}
