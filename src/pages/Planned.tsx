import { Construction } from 'lucide-react'
import { EmptyState } from '../components/ui'
import { NAV } from '../nav'

// Honest placeholder for screens not built yet; shows no buttons that pretend to work.
export default function Planned({ path }: { path: string }) {
  const item = NAV.find((n) => n.to === path)
  if (!item) return <EmptyState title="Page not found">Use the menu to pick a section.</EmptyState>
  return (
    <section>
      <h1 className="mb-6 text-2xl font-semibold">{item.label}</h1>
      <EmptyState icon={<Construction size={28} aria-hidden />} title="Not built yet">
        This section is planned for Day {item.day} of the build. Nothing here works yet.
      </EmptyState>
    </section>
  )
}
