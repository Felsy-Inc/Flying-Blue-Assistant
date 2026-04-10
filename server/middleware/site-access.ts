import { getCookie, getRequestURL, sendRedirect } from 'h3'
import {
  SITE_GATE_COOKIE,
  isSiteAccessConfigured,
  siteAccessExemptPath,
  verifySiteGateToken,
} from '~~/server/utils/site-access'

export default defineEventHandler((event) => {
  const password = process.env.SITE_ACCESS_PASSWORD?.trim()
  if (!password || !isSiteAccessConfigured()) return

  const url = getRequestURL(event)
  const path = url.pathname
  if (siteAccessExemptPath(path)) return

  const token = getCookie(event, SITE_GATE_COOKIE)
  if (verifySiteGateToken(token, password)) return

  if (path.startsWith('/api/')) {
    throw createError({ statusCode: 401, statusMessage: 'site_access_required' })
  }

  const next = encodeURIComponent(`${path}${url.search}`)
  return sendRedirect(event, `/site-access?next=${next}`, 302)
})
