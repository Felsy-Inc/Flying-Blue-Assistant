/**
 * Load `.env` / `.env.local` into `process.env`.
 *
 * Call with the **project root** (directory containing `nuxt.config`):
 * - From `nuxt.config.ts`: `dirname(fileURLToPath(import.meta.url))`
 *
 * Do not rely on `import.meta.url` inside this module after Nitro bundles it — paths break in `.output/`.
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export function applyProjectDotenv(projectRoot: string): void {
  applyEnvFile(resolve(projectRoot, '.env'), false)
  applyEnvFile(resolve(projectRoot, '.env.local'), true)
}

function applyEnvFile(path: string, override: boolean) {
  if (!existsSync(path)) return
  const raw = readFileSync(path, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (!override && process.env[key] !== undefined) continue
    process.env[key] = val
  }
}

/** Walk up from `cwd` until a Nuxt config file exists (Nitro `rootDir` is wrong in some dev setups). */
export function resolveNuxtProjectRoot(cwd: string = process.cwd()): string {
  let dir = cwd
  for (let i = 0; i < 16; i++) {
    if (
      existsSync(resolve(dir, 'nuxt.config.ts')) ||
      existsSync(resolve(dir, 'nuxt.config.mjs')) ||
      existsSync(resolve(dir, 'nuxt.config.js'))
    ) {
      return dir
    }
    const parent = resolve(dir, '..')
    if (parent === dir) break
    dir = parent
  }
  return cwd
}

let dotenvLoadedForBilling = false

/** Reload `.env` once per Nitro worker so API routes see billing flags even if `rootDir` was wrong. */
export function ensureProjectDotenvForRuntime(): void {
  if (dotenvLoadedForBilling) return
  dotenvLoadedForBilling = true
  applyProjectDotenv(resolveNuxtProjectRoot())
}
