import type { RouteLocationRaw } from 'vue-router'

/**
 * Apply Nuxt i18n `localePath` when `path` has no `/nl` or `/fr` prefix yet.
 * Keeps `prefix_except_default` URLs consistent for redirects and cookie "next" values.
 */
export function withLocaleInternalPath(
  path: string,
  localePath: (to: RouteLocationRaw) => string,
): string {
  if (!path.startsWith('/') || path.startsWith('//')) return path
  if (/^\/(nl|fr)(\/|$)/.test(path)) return path
  return localePath(path)
}
