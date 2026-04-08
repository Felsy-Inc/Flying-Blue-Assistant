export const locales = ['en', 'nl', 'fr'] as const
export type Locale = (typeof locales)[number]
