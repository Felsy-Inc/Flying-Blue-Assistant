/** Calendar arithmetic in UTC for `YYYY-MM-DD` (award dates are date-only). */
export function parseIsoDateUtc(iso: string): Date {
  const parts = iso.split('-').map((n) => Number.parseInt(n, 10))
  const y = parts[0] ?? 0
  const m = parts[1] ?? 1
  const d = parts[2] ?? 1
  return new Date(Date.UTC(y, m - 1, d))
}

export function formatIsoDateUtc(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addCalendarDaysUtc(iso: string, deltaDays: number): string {
  const d = parseIsoDateUtc(iso)
  d.setUTCDate(d.getUTCDate() + deltaDays)
  return formatIsoDateUtc(d)
}

export function eachDateInclusive(startIso: string, endIso: string): string[] {
  const start = parseIsoDateUtc(startIso)
  const end = parseIsoDateUtc(endIso)
  const out: string[] = []
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    out.push(formatIsoDateUtc(new Date(d)))
  }
  return out
}
