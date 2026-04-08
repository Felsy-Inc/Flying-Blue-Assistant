/**
 * Normalize `$fetch` / ofetch errors from Nitro/h3 so catch blocks stay consistent.
 * Handles `statusCode` vs `status`, and `statusMessage` vs `statusText`.
 */

export type ParsedFetchError = {
  statusCode: number | undefined
  statusMessage: string | undefined
  data: unknown
  fieldErrors: Record<string, string[] | undefined> | undefined
  reason: string | undefined
  message: string | undefined
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

export function parseFetchError(error: unknown): ParsedFetchError {
  if (!isRecord(error)) {
    return {
      statusCode: undefined,
      statusMessage: undefined,
      data: undefined,
      fieldErrors: undefined,
      reason: undefined,
      message: error instanceof Error ? error.message : undefined,
    }
  }

  const statusCode =
    typeof error.statusCode === 'number'
      ? error.statusCode
      : typeof error.status === 'number'
        ? error.status
        : undefined

  const statusMessage =
    typeof error.statusMessage === 'string'
      ? error.statusMessage
      : typeof error.statusText === 'string'
        ? error.statusText
        : undefined

  const data = error.data
  let fieldErrors: Record<string, string[] | undefined> | undefined
  let reason: string | undefined

  if (isRecord(data)) {
    if (typeof data.reason === 'string') {
      reason = data.reason
    }
    const fe = data.fieldErrors
    if (isRecord(fe)) {
      fieldErrors = fe as Record<string, string[] | undefined>
    }
  }

  return {
    statusCode,
    statusMessage,
    data,
    fieldErrors,
    reason,
    message: typeof error.message === 'string' ? error.message : undefined,
  }
}

export function isApiValidationFailed(parsed: ParsedFetchError): boolean {
  return parsed.statusCode === 400 && parsed.statusMessage === 'validation_failed'
}
