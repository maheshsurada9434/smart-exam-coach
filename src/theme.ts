import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { prefersReducedMotion } from './components/motion'

export type Theme = 'light' | 'dark'
const KEY = 'sec-theme'

// Theme is a per-browser convenience, so localStorage is enough; study data goes to IndexedDB (Day 2).
export function readTheme(): Theme {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* storage blocked: fall back to light */
  }
  return 'light'
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readTheme)
  useEffect(() => {
    applyTheme(theme)
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      /* ignore */
    }
  }, [theme])
  // Where the browser supports View Transitions, the new theme grows as a circle from the button.
  const toggle = (at?: { clientX: number; clientY: number }) => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown }
    if (!doc.startViewTransition || prefersReducedMotion()) return setTheme(next)
    if (at) {
      document.documentElement.style.setProperty('--vt-x', `${at.clientX}px`)
      document.documentElement.style.setProperty('--vt-y', `${at.clientY}px`)
    }
    doc.startViewTransition(() => {
      flushSync(() => setTheme(next))
      applyTheme(next)
    })
  }
  return { theme, toggle }
}
