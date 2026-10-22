// Small, dependency-free visual effects. All of them do nothing when the user prefers reduced motion.
import { prefersReducedMotion } from './motion'

const COLORS = ['#14b8a6', '#22d3ee', '#818cf8', '#f472b6', '#fbbf24', '#34d399']

/** A short confetti burst from an element (e.g. the correct answer). Pure CSS animation, removed after 1 s. */
export function burst(from: Element | null, count = 22) {
  if (!from || prefersReducedMotion() || typeof document === 'undefined') return
  const r = from.getBoundingClientRect()
  const layer = document.createElement('div')
  layer.className = 'fx-layer'
  layer.setAttribute('aria-hidden', 'true')
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span')
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5
    const dist = 70 + Math.random() * 110
    p.className = 'fx-piece'
    p.style.left = `${r.left + r.width / 2}px`
    p.style.top = `${r.top + r.height / 2}px`
    p.style.background = COLORS[i % COLORS.length]!
    p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`)
    p.style.setProperty('--dy', `${Math.sin(angle) * dist - 40}px`)
    p.style.setProperty('--rot', `${Math.round(Math.random() * 720 - 360)}deg`)
    p.style.animationDelay = `${Math.random() * 60}ms`
    layer.appendChild(p)
  }
  document.body.appendChild(layer)
  setTimeout(() => layer.remove(), 1100)
}

/**
 * Pointer effects for mouse users: light that follows the cursor on `.glass` surfaces, and a gentle
 * 3D tilt on `.tilt` cards. Uses one listener for the whole page. Returns a cleanup function.
 */
export function installPointerFx() {
  if (typeof window === 'undefined' || prefersReducedMotion() || !window.matchMedia('(hover: hover)').matches) return () => {}
  let tilted: HTMLElement | null = null
  const reset = (el: HTMLElement | null) => {
    if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }
  const move = (e: PointerEvent) => {
    const t = e.target as Element | null
    const glass = t?.closest?.('.glass') as HTMLElement | null
    if (glass) {
      const r = glass.getBoundingClientRect()
      glass.style.setProperty('--mx', `${e.clientX - r.left}px`)
      glass.style.setProperty('--my', `${e.clientY - r.top}px`)
    }
    const tilt = t?.closest?.('.tilt') as HTMLElement | null
    if (tilt !== tilted) {
      reset(tilted)
      tilted = tilt
    }
    if (tilt) {
      const r = tilt.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width - 0.5
      const y = (e.clientY - r.top) / r.height - 0.5
      tilt.style.setProperty('--ry', `${(x * 7).toFixed(2)}deg`)
      tilt.style.setProperty('--rx', `${(-y * 7).toFixed(2)}deg`)
    }
  }
  const leave = () => {
    reset(tilted)
    tilted = null
  }
  window.addEventListener('pointermove', move, { passive: true })
  document.addEventListener('pointerleave', leave)
  return () => {
    window.removeEventListener('pointermove', move)
    document.removeEventListener('pointerleave', leave)
  }
}
