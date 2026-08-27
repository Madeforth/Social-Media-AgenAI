import type { AssertEqual } from './common';
import type { Enums, Tables } from './database';

/**
 * Canonical post lifecycle. This runtime array exists so clients can iterate the
 * statuses; the type itself comes from the database enum, and the assertion
 * below fails the build if the two ever drift.
 */
export const POST_STATUSES = [
  'DRAFT',
  'GENERATING',
  'READY',
  'REVISION',
  'APPROVED',
  'SCHEDULED',
  'PUBLISHING',
  'PUBLISHED',
  'FAILED',
  'CANCELLED',
] as const;

export type PostStatus = Enums<'post_status'>;

export const POST_STATUS_ENUM_MATCHES: AssertEqual<PostStatus, (typeof POST_STATUSES)[number]> =
  true;

/**
 * Creative formats the strategy layer may choose from. Product UI is one option
 * among many and must never become the default.
 */
export const VISUAL_FORMATS = [
  'PRODUCT_UI',
  'CINEMATIC_LIFESTYLE',
  'RIDER_COMMUNITY',
  'EDITORIAL_TYPOGRAPHY',
  'DATA_VISUALIZATION',
  'EDUCATIONAL_CAROUSEL',
  'ACHIEVEMENT_BADGE',
  'TEASER_LAUNCH',
  'MANIFESTO',
  'SEASONAL',
] as const;

export type VisualFormat = Enums<'visual_format'>;

export const VISUAL_FORMAT_ENUM_MATCHES: AssertEqual<
  VisualFormat,
  (typeof VISUAL_FORMATS)[number]
> = true;

/** Statuses a post can still be edited from. */
export const EDITABLE_POST_STATUSES: readonly PostStatus[] = ['DRAFT', 'READY', 'REVISION'];

/** Statuses that mean the post is out of the user's hands. */
export const TERMINAL_POST_STATUSES: readonly PostStatus[] = ['PUBLISHED', 'FAILED', 'CANCELLED'];

export type Post = Tables<'posts'>;

export type PostVersionAuthor = Enums<'post_version_author'>;

export type PostVersion = Omit<Tables<'post_versions'>, 'hashtags' | 'model_metadata'> & {
  hashtags: string[];
  model_metadata: Record<string, unknown> | null;
};

/** A post joined with the version currently shown to the user. */
export interface PostWithVersion extends Post {
  version: PostVersion;
}
