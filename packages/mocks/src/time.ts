/**
 * Fixed reference instant for every fixture. Nothing in this package calls
 * `Date.now()`, so server-rendered and client-rendered output always match.
 */
export const MOCK_NOW = '2026-08-27T09:00:00.000Z';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** An ISO timestamp offset from `MOCK_NOW`. */
export function fromNow(options: { days?: number; hours?: number }): string {
  const base = new Date(MOCK_NOW).getTime();
  const offset = (options.days ?? 0) * DAY_MS + (options.hours ?? 0) * HOUR_MS;
  return new Date(base + offset).toISOString();
}
