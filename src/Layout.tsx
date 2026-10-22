import { useEffect, useState } from 'react'
import { installPointerFx } from './components/fx'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { GraduationCap, Menu, Moon, Sun } from 'lucide-react'
import { NAV } from './nav'
import { Dialog } from './components/ui'
import { useTheme } from './theme'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'relative flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition duration-fast',
    // The bar on the left marks the current page without relying on colour alone.
    "before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-full before:transition-transform before:duration-base before:content-['']",
    isActive ? 'bg-accent-soft text-accent before:scale-y-100 before:bg-accent' : 'text-muted hover:bg-surface-2 hover:text-ink before:scale-y-0',
  ].join(' ')

const Brand = () => (
  <span className="flex items-center gap-2">
    <span className="btn-primary grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-ink">
      <GraduationCap size={18} aria-hidden />
    </span>
    <span className="font-display text-[17px] font-semibold tracking-tight">Smart Exam Coach</span>
  </span>
)

export default function Layout() {
  const { theme, toggle } = useTheme()
  const [moreOpen, setMoreOpen] = useState(false)
  const { pathname } = useLocation()
  // Practice and mock sessions keep the background still, so nothing moves during a test.
  const calm = /\/(session|run)\//.test(pathname)
  useEffect(() => installPointerFx(), [])
  const ThemeIcon = theme === 'dark' ? Sun : Moon
  const themeLabel = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <div className="min-h-dvh md:flex">
      <div className="aurora" data-calm={calm} aria-hidden>
        <span />
        <span />
        <span />
        <span />
      </div>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-toast focus:rounded-md focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="glass sticky top-0 hidden h-dvh w-64 shrink-0 flex-col rounded-none border-y-0 border-l-0 md:flex">
        <div className="px-5 py-5">
          <Brand />
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
          <button type="button" onClick={(e) => toggle(e)} className={linkClass({ isActive: false }) + ' w-full'}>
            <ThemeIcon size={18} aria-hidden />
            {themeLabel}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="glass sticky top-0 z-nav flex items-center justify-between rounded-none border-x-0 border-t-0 px-4 py-2 md:hidden">
          <Brand />
          <button
            type="button"
            onClick={(e) => toggle(e)}
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
        className="glass pb-safe fixed inset-x-0 bottom-0 z-nav grid grid-cols-5 rounded-none border-x-0 border-b-0 md:hidden"
      >
        {NAV.filter((n) => n.mobile).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `group flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${isActive ? 'text-accent' : 'text-muted'}`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`grid h-7 w-12 place-items-center rounded-full transition duration-base ${isActive ? 'bg-accent-soft' : ''}`}>
                  <Icon size={20} aria-hidden />
                </span>
                <span className="truncate">{label === 'Mock Tests' ? 'Mock' : label}</span>
              </>
            )}
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
