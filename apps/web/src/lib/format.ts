/**
 * All formatting is pinned to UTC. The app renders on the server and hydrates on
 * the client, and a timezone difference between the two would produce a
 * hydration mismatch on every date on the page.
 */
const TIME_ZONE = 'UTC';

const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: TIME_ZONE });
const dayOfMonth = new Intl.DateTimeFormat('en-GB', { day: '2-digit', timeZone: TIME_ZONE });
const dayMonthYear = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: TIME_ZONE,
});
const clock = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: TIME_ZONE,
});
const monthYear = new Intl.DateTimeFormat('en-GB', {
  month: 'long',
  year: 'numeric',
  timeZone: TIME_ZONE,
});

export const formatWeekday = (iso: string) => weekday.format(new Date(iso)).toUpperCase();
export const formatDayOfMonth = (iso: string) => dayOfMonth.format(new Date(iso));
export const formatDate = (iso: string) => dayMonthYear.format(new Date(iso));
export const formatTime = (iso: string) => clock.format(new Date(iso));
export const formatMonthYear = (iso: string) => monthYear.format(new Date(iso));
