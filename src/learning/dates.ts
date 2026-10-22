// Calendar dates as local "YYYY-MM-DD" strings. Arithmetic is done in UTC so DST never shifts a day.
const pad = (n: number) => String(n).padStart(2, '0')

export const localDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

const parts = (s: string) => s.split('-').map(Number) as [number, number, number]

export function addDays(s: string, n: number) {
  const [y, m, d] = parts(s)
  const t = new Date(Date.UTC(y, m - 1, d + n))
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`
}

/** 0 = Sunday … 6 = Saturday */
export const weekday = (s: string) => {
  const [y, m, d] = parts(s)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

export const daysBetween = (a: string, b: string) => {
  const [y1, m1, d1] = parts(a)
  const [y2, m2, d2] = parts(b)
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000)
}

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
