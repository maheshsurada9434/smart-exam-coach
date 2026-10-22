import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

/** True when the user asked for less motion, or the platform cannot tell us (tests, very old browsers). */
export const prefersReducedMotion = () =>
  typeof window === 'undefined' || !window.matchMedia || window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Index for `.stagger` children; capped so long lists do not wait seconds for their last rows. */
export const staggerStyle = (i: number) => ({ '--i': Math.min(i, 10) }) as CSSProperties

/** Counts up to a real value once (no fake numbers: it only animates the value it is given). */
export function CountUp({ value, decimals = 0, suffix = '', duration = 700 }: { value: number; decimals?: number; suffix?: string; duration?: number }) {
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? value : 0))
  const from = useRef(prefersReducedMotion() ? value : 0)
  useEffect(() => {
    if (prefersReducedMotion()) {
      setShown(value)
      return
    }
    const start = performance.now()
    const a = from.current
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - (1 - p) ** 3
      setShown(a + (value - a) * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
      else from.current = value
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])
  return (
    <span className="tabular">
      {shown.toFixed(decimals)}
      {suffix}
    </span>
  )
}

/** Circular progress (0–100). The arc animates via CSS transition, so reduced motion makes it instant. */
export function ProgressRing({ value, size = 96, stroke = 9, label, children }: { value: number; size?: number; stroke?: number; label: string; children?: ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const [v, setV] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setV(Math.max(0, Math.min(100, value))))
    return () => cancelAnimationFrame(id)
  }, [value])
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-surface-2)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v / 100)}
          style={{ transition: 'stroke-dashoffset var(--dur-slow) var(--ease-out)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}
