import { absoluteUrlForLocale, escapeXmlAttr, locales } from '~lib/seo/locale-urls'
import type { Locale } from '~lib/i18n/locales'
import { localeSeoTags } from '~lib/i18n/locales'

/** Logical paths (default-locale URLs have no prefix; see `prefix_except_default`). */
const INDEXABLE_PATHS = ['/', '/pricing', '/login', '/signup'] as const

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const base = String(config.public.appUrl ?? '').replace(/\/$/, '').trim()
  const lastmod = String(config.public.sitemapLastmod ?? '').slice(0, 10) || new Date().toISOString().slice(0, 10)

  if (!base) {
    setResponseStatus(event, 503)
    setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
    return 'Sitemap unavailable: NUXT_PUBLIC_APP_URL is not set.'
  }

  const lines: string[] = []
  lines.push('<?xml version="1.0" encoding="UTF-8"?>')
  lines.push(
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  )

  for (const path of INDEXABLE_PATHS) {
    for (const loc of locales) {
      const locUrl = absoluteUrlForLocale(base, loc as Locale, path)
      lines.push('  <url>')
      lines.push(`    <loc>${escapeXmlAttr(locUrl)}</loc>`)
      lines.push(`    <lastmod>${escapeXmlAttr(lastmod)}</lastmod>`)
      for (const alt of locales) {
        const tag = localeSeoTags[alt as Locale].hreflang
        lines.push(
          `    <xhtml:link rel="alternate" hreflang="${escapeXmlAttr(tag)}" href="${escapeXmlAttr(absoluteUrlForLocale(base, alt as Locale, path))}" />`,
        )
      }
      lines.push(
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXmlAttr(absoluteUrlForLocale(base, 'en', path))}" />`,
      )
      lines.push('  </url>')
    }
  }

  lines.push('</urlset>')

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600')
  return lines.join('\n')
})
