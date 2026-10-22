import { AlertTriangle, BadgeCheck, Info } from 'lucide-react'
import type { Verification } from '../data/exams'

const MAP = {
  official: { label: 'Checked against official notification', icon: BadgeCheck, cls: 'text-success' },
  secondary: { label: 'From a published summary, not yet checked against the notification', icon: Info, cls: 'text-warning' },
  unverified: { label: 'Unverified', icon: AlertTriangle, cls: 'text-danger' },
} as const

export default function VerificationBadge({ value }: { value: Verification }) {
  const { label, icon: Icon, cls } = MAP[value]
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cls}`}>
      <Icon size={14} aria-hidden />
      {label}
    </span>
  )
}
