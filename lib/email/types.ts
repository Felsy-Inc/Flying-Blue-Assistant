/**
 * Discriminator for transactional sends + DB `email_send_logs.email_type`.
 * Extend with welcome, receipt, etc. in later phases.
 */
export type TransactionalEmailKind = 'alert_test' | 'alert_match'
