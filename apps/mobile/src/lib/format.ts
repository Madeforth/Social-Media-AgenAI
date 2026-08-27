/**
 * Formatting is pinned to UTC so the mobile app and the web app label the same
 * fixture with the same date, whatever the device timezone is.
 */
const TIME_ZONE = 'UTC';

const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: TIME_ZONE });
const dayOfMonth = new Intl.DateTimeFormat('en-GB', { day: '2-digit', timeZone: TIME_ZONE });
const dayMonth = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  timeZone: TIME_ZONE,
});
const clock = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: TIME_ZONE,
});

export const formatWeekday = (iso: string) => weekday.format(new Date(iso)).toUpperCase();
export const formatDayOfMonth = (iso: string) => dayOfMonth.format(new Date(iso));
export const formatDayMonth = (iso: string) => dayMonth.format(new Date(iso));
export const formatTime = (iso: string) => clock.format(new Date(iso));
