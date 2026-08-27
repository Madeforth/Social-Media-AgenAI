import type { AssertEqual } from './common';
import type { Enums, Tables } from './database';

export type SocialPlatform = Enums<'social_platform'>;

export type SocialAccountStatus = Enums<'social_account_status'>;

/**
 * The client-visible shape of a connected account. `token_secret_ref` is
 * deliberately omitted: `authenticated` has no SELECT grant on that column, and
 * the token it points at never leaves the server.
 *
 * Because the grant is column-level, `select('*')` on this table fails with
 * "permission denied for table social_accounts". Always name the columns.
 */
export type SocialAccount = Omit<Tables<'social_accounts'>, 'token_secret_ref'>;

export const PUBLICATION_JOB_STATUSES = [
  'PENDING',
  'RUNNING',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
] as const;

export type PublicationJobStatus = Enums<'publication_job_status'>;

export const PUBLICATION_JOB_STATUS_ENUM_MATCHES: AssertEqual<
  PublicationJobStatus,
  (typeof PUBLICATION_JOB_STATUSES)[number]
> = true;

/**
 * Publishing is always a server-side job with explicit state transitions.
 * A client action never publishes directly.
 */
export type PublicationJob = Tables<'publication_jobs'>;

export type PostMetrics = Omit<Tables<'post_metrics'>, 'raw_metrics'> & {
  raw_metrics: Record<string, unknown> | null;
};

export type NotificationType = Enums<'notification_type'>;

export type AppNotification = Omit<Tables<'notifications'>, 'payload'> & {
  payload: Record<string, unknown> | null;
};
