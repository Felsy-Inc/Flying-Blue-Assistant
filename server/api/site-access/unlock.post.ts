import {
  SITE_GATE_COOKIE,
  isSiteAccessConfigured,
  makeSiteGateToken,
  verifySiteAccessPassword,
} from '~~/server/utils/site-access'

const GATE_TTL_SEC = 60 * 60 * 24 * 14

export default defineEventHandler(async (event) => {
  const password = process.env.SITE_ACCESS_PASSWORD?.trim()
  if (!password || !isSiteAccessConfigured()) {
    throw createError({ statusCode: 404, statusMessage: 'not_found' })
  }

  let body: { password?: string } = {}
  try {
    body = await readBody<{ password?: string }>(event)
  } catch {
    body = {}
  }
  const input = typeof body.password === 'string' ? body.password : ''

  if (!verifySiteAccessPassword(input, password)) {
    throw createError({ statusCode: 401, statusMessage: 'unauthorized' })
  }

  const token = makeSiteGateToken(password, GATE_TTL_SEC)
  setCookie(event, SITE_GATE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: GATE_TTL_SEC,
  })

  return { ok: true as const }
})
