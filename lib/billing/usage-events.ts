/** Canonical `usage_events.event_type` values (extend as needed). */
export const UsageEventType = {
  searchExecuted: 'search_executed',
  alertCheck: 'alert_check',
} as const

export type UsageEventTypeName = (typeof UsageEventType)[keyof typeof UsageEventType]
