export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const base = String(config.public.appUrl ?? '').replace(/\/$/, '').trim()

  const lines = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /app/',
    '',
    ...(base ? [`Sitemap: ${base}/sitemap.xml`] : []),
    '',
  ]

  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=86400, s-maxage=86400')
  return lines.join('\n')
})
