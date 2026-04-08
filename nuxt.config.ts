import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { NuxtConfig } from 'nuxt/schema'
import { applyProjectDotenv } from './env/load-dotenv'

type ViteCustomLogger = {
  warn?: (msg: string | unknown, options?: unknown) => void
}

const projectRoot = dirname(fileURLToPath(import.meta.url))
applyProjectDotenv(projectRoot)

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY
const enableSupabaseModule = Boolean(supabaseUrl && supabaseKey)

/** Dotenv often yields `True` / `1`; strict `=== 'true'` hid billing in production prerender too. */
function envTruthy(v: string | undefined): boolean {
  if (v === undefined || v === '') return false
  const s = v.trim().toLowerCase()
  return s === 'true' || s === '1' || s === 'yes'
}

/** Tailwind v4 + Nuxt polyfill emit transform steps without CSS maps → noisy Vite warns (harmless). */
const patchedViteLoggers = new WeakSet<ViteCustomLogger>()

function patchViteLogger(config: { customLogger?: ViteCustomLogger }) {
  const logger = config.customLogger as ViteCustomLogger | undefined
  if (!logger?.warn || patchedViteLoggers.has(logger)) return
  patchedViteLoggers.add(logger)
  const originalWarn = logger.warn!.bind(logger)
  logger.warn = (msg: string | unknown, options?: unknown) => {
    const text = typeof msg === 'string' ? msg : String(msg)
    if (
      text.includes('Sourcemap is likely to be incorrect') &&
      (text.includes('@tailwindcss/vite:generate') ||
        text.includes('nuxt:module-preload-polyfill'))
    ) {
      return
    }
    originalWarn(msg, options)
  }
}

export default defineNuxtConfig({
  devtools: { enabled: true },
  compatibilityDate: '2026-03-20',

  /** Nested dirs (e.g. `fba/alerts/`) otherwise register as `FbaAlertsFbaAlertEditor` instead of `FbaAlertEditor`. */
  components: [{ path: '~/components', pathPrefix: false }],

  /**
   * Prevents dev-time `ENOTDIR` under `.nuxt/cache/nuxt/payload/<route>` when unstorage’s
   * filesystem layout conflicts with prerendered routes (e.g. `/pricing`). If you need
   * extracted payloads, set `true` and run `rm -rf .nuxt node_modules/.cache/nuxt` first.
   */
  experimental: {
    payloadExtraction: false,
  },

  hooks: {
    /** Nuxt passes full Vite config; we only touch `customLogger.warn` signature noise. */
    'vite:configResolved': (config) => patchViteLogger(config as { customLogger?: ViteCustomLogger }),
  },

  /**
   * Keep SSR server maps off (smaller / faster). Client follows Nuxt defaults (maps in dev).
   * Known-upstream Tailwind CSS sourcemap warnings are filtered in `vite:configResolved`.
   */
  sourcemap: {
    server: process.env.NUXT_SOURCEMAP === 'true',
  },

  alias: {
    '~lib': fileURLToPath(new URL('./lib', import.meta.url)),
  },

  vite: {
    css: {
      devSourcemap: false,
    },
  },

  nitro: {
    // Vercel sets VERCEL=1 at build time.
    preset: process.env.VERCEL ? 'vercel' : 'node-server',
  },

  routeRules: {
    /** Stripe signature verification needs the raw body (see `server/api/stripe/webhook.post.ts`). */
    '/api/stripe/webhook': { bodyParser: false },
    '/': { prerender: true },
    /** Needs request-time `BILLING_ENABLED` in payload; prerender bakes build-time env → wrong CTAs. */
    '/pricing': { prerender: false },
    '/login': { prerender: false },
    '/signup': { prerender: false },
    '/nl/**': { prerender: false },
    '/fr/**': { prerender: false },
    '/app/**': { prerender: false },
    '/auth/**': { prerender: false },
  } as NuxtConfig['routeRules'],

  modules: [
    '@nuxtjs/i18n',
    '@nuxt/ui',
    ...(enableSupabaseModule ? ['@nuxtjs/supabase'] : []),
  ],

  i18n: {
    vueI18n: fileURLToPath(new URL('./i18n/i18n.config.ts', import.meta.url)),
    defaultLocale: 'en',
    strategy: 'prefix_except_default',
    locales: [
      { code: 'en', language: 'en-US', name: 'English' },
      { code: 'nl', language: 'nl-NL', name: 'Nederlands' },
      { code: 'fr', language: 'fr-FR', name: 'Français' },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'fba-locale',
      fallbackLocale: 'en',
      redirectOn: 'root',
    },
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // Server-only
    databaseUrl: process.env.DATABASE_URL,
    resendApiKey: process.env.RESEND_API_KEY,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    /** Signing secret from Stripe Dashboard → Webhooks (starts with `whsec_`). */
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    /** Pro monthly price id (`price_...`); yearly can use a separate env key later. */
    stripePriceProMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    /** Resend `from` (e.g. `noreply@verified.domain` or `Name <noreply@...>`). Server-only. */
    emailFrom: process.env.EMAIL_FROM,
    /** Vercel Cron + manual triggers: `Authorization: Bearer <CRON_SECRET>`. */
    cronSecret: process.env.CRON_SECRET,

    // Exposed to client
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
      appUrl: process.env.NUXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      /** ISO date (YYYY-MM-DD) for sitemap `<lastmod>`; set `NUXT_PUBLIC_SITEMAP_LASTMOD` to override. */
      sitemapLastmod:
        process.env.NUXT_PUBLIC_SITEMAP_LASTMOD ?? new Date().toISOString().slice(0, 10),
      /** Prefer `NUXT_PUBLIC_*` (Nuxt runtime override); `BILLING_ENABLED` works after `env/load-dotenv` runs. */
      billingEnabled: envTruthy(
        process.env.NUXT_PUBLIC_BILLING_ENABLED ?? process.env.BILLING_ENABLED,
      ),
      /**
       * Absolute image URL, or site-relative path (e.g. `/og.png`) resolved against `appUrl`.
       * Leave empty if you have no share image yet—do not point at a missing file.
       */
      ogImageUrl: process.env.NUXT_PUBLIC_OG_IMAGE_URL ?? '',

      featureFlags: {
        useMockProvider: process.env.USE_MOCK_PROVIDER === 'true',
        emailsEnabled: process.env.EMAILS_ENABLED === 'true',
        publicBrowseEnabled: process.env.PUBLIC_BROWSE_ENABLED === 'true',
        billingEnabled: envTruthy(
          process.env.NUXT_PUBLIC_BILLING_ENABLED ?? process.env.BILLING_ENABLED,
        ),
      },
    },
  },

  supabase: enableSupabaseModule
    ? {
        url: supabaseUrl,
        key: supabaseKey,
        /** Repo root: `app/` is `srcDir`, so default `~/types/...` would not resolve here. */
        types: fileURLToPath(new URL('./types/database.types.ts', import.meta.url)),
        cookieOptions: {
          maxAge: 60 * 60 * 8,
          sameSite: 'lax',
          // Local dev is usually http://localhost — secure cookies break the session.
          secure: process.env.NODE_ENV === 'production',
        },
        redirectOptions: {
          /** Locale-aware login: `/auth/login` redirects to `localePath('/login')`. */
          login: '/auth/login',
          callback: '/auth/confirm',
          /** Only `/app` requires a session (avoids breaking prerender of marketing pages). */
          include: ['/app', '/app/*'],
          exclude: [],
          saveRedirectToCookie: true,
        },
      }
    : undefined,

  app: {
    head: {
      meta: [{ charset: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    },
  },
})

