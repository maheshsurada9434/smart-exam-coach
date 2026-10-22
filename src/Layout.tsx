import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { GraduationCap, Menu, Moon, Sun } from 'lucide-react'
import { NAV } from './nav'
import { Dialog } from './components/ui'
import { useTheme } from './theme'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition duration-fast',
    isActive ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-surface-2 hover:text-ink',
  ].join(' ')

export default function Layout() {
  const { theme, toggle } = useTheme()
  const [moreOpen, setMoreOpen] = useState(false)
  const { pathname } = useLocation()
  const ThemeIcon = theme === 'dark' ? Sun : Moon
  const themeLabel = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <div className="min-h-dvh md:flex">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-toast focus:rounded-md focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-surface md:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <GraduationCap className="text-accent" size={24} aria-hidden />
          <span className="font-semibold">Smart Exam Coach</span>
        </div>
        <nav aria-label="Main" className="flex-1 space-y-1 overflow-y-auto px-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className={linkClass}>
              <Icon size={18} aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <button type="button" onClick={toggle} className={linkClass({ isActive: false }) + ' w-full'}>
            <ThemeIcon size={18} aria-hidden />
            {themeLabel}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-nav flex items-center justify-between border-b border-border bg-surface px-4 py-2 md:hidden">
          <div className="flex items-center gap-2">
            <GraduationCap className="text-accent" size={22} aria-hidden />
            <span className="font-semibold">Smart Exam Coach</span>
          </div>
          <button
            type="button"
            onClick={toggle}
            aria-label={themeLabel}
            className="grid h-11 w-11 place-items-center rounded-md hover:bg-surface-2"
          >
            <ThemeIcon size={20} aria-hidden />
          </button>
        </header>

        <main id="main" key={pathname} className="animate-page-in mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Main"
        className="pb-safe fixed inset-x-0 bottom-0 z-nav grid grid-cols-5 border-t border-border bg-surface md:hidden"
      >
        {NAV.filter((n) => n.mobile).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${isActive ? 'text-accent' : 'text-muted'}`
            }
          >
            <Icon size={20} aria-hidden />
            <span className="truncate">{label === 'Mock Tests' ? 'Mock' : label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted"
        >
          <Menu size={20} aria-hidden />
          More
        </button>
      </nav>

      <Dialog open={moreOpen} onClose={() => setMoreOpen(false)} title="More" sheet>
        <nav aria-label="More sections" className="space-y-1" onClick={() => setMoreOpen(false)}>
          {NAV.filter((n) => !n.mobile).map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClass}>
              <Icon size={18} aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
      </Dialog>
    </div>
  )
}
