/** Current time as an ISO 8601 UTC string, the format used for all stored timestamps. */
export function nowIso(): string {
  return new Date().toISOString();
}

/** Formats a duration as "m:ss" (or "h:mm:ss" for an hour or more), e.g. 65000 → "1:05". */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const ss = String(seconds).padStart(2, '0');
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${ss}` : `${minutes}:${ss}`;
}
