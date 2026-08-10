/**
 * Relative-time formatting for feed timestamps. The API returns ISO-8601
 * `created_at`; the "2h ago" phrasing is a display concern, so it lives here
 * rather than being precomputed server-side.
 */
export function relativeTime(iso: string): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return 'recently';

  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  return months < 12 ? `${months}mo ago` : `${Math.floor(days / 365)}y ago`;
}
