const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Formats an ISO date string as a short, readable date, e.g. "Nov 12, 2026".
 * Returns an empty string for invalid input.
 */
export function formatShortDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/** Formats a local time, e.g. "9:05 AM". Returns an empty string for invalid input. */
export function formatTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours % 12 === 0 ? 12 : hours % 12}:${minutes} ${hours < 12 ? 'AM' : 'PM'}`;
}

/** Date and time, e.g. "Nov 12, 2026 at 9:05 AM". */
export function formatDateTime(isoDate: string): string {
  const day = formatShortDate(isoDate);
  return day ? `${day} at ${formatTime(isoDate)}` : '';
}
