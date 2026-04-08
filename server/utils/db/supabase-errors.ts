/** PostgREST / Postgres errors when tables or views are missing (migrations not applied). */
export function isMissingDbObjectError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const e = error as { code?: string; message?: string }
  if (e.code === 'PGRST205' || e.code === '42P01') return true
  const m = e.message ?? ''
  return (
    m.includes('schema cache') ||
    m.includes('Could not find the table') ||
    m.includes('does not exist') ||
    m.includes('relation') && m.includes('does not exist')
  )
}
