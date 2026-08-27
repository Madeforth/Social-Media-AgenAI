/** UUID primary key, as stored in PostgreSQL. */
export type Uuid = string;

/** ISO-8601 timestamp with timezone (PostgreSQL `timestamptz`). */
export type IsoDateTime = string;

/** ISO-8601 calendar date, `YYYY-MM-DD` (PostgreSQL `date`). */
export type IsoDate = string;

/** Path inside a Supabase Storage bucket. Image binaries never live in PostgreSQL. */
export type StoragePath = string;

/**
 * Resolves to `true` only when two types are mutually assignable, and to `never`
 * otherwise. Assigning `true` to it turns drift into a compile error. Used to fail
 * the build if a runtime constant drifts from the database enum it mirrors.
 */
export type AssertEqual<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;
