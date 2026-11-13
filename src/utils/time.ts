/** Current time as an ISO 8601 UTC string, the format used for all stored timestamps. */
export function nowIso(): string {
  return new Date().toISOString();
}
