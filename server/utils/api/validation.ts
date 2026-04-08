import type { ZodError } from 'zod'

/** Consistent 400 for Zod failures from API bodies (matches client `statusMessage: 'validation_failed'`). */
export function throwValidationFailed(error: ZodError): never {
  throw createError({
    statusCode: 400,
    statusMessage: 'validation_failed',
    data: { fieldErrors: error.flatten().fieldErrors },
  })
}
