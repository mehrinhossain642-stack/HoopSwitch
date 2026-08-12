/**
 * YouTube link helpers. The MVP hosts no media (proposal §6) — highlights are
 * external links — so a thumbnail is derived from the video id rather than
 * uploaded or fetched via an API.
 */

/** Extracts the video id from watch, youtu.be and shorts URLs. */
export function youTubeVideoId(url: string): string | null {
  const trimmed = url.trim();
  if (trimmed.length === 0) return null;

  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{6,})/,
    /youtu\.be\/([A-Za-z0-9_-]{6,})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

export function youTubeThumbnail(url: string): string | null {
  const id = youTubeVideoId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

export function isLikelyVideoUrl(url: string): boolean {
  const trimmed = url.trim();
  if (trimmed.length === 0) return false;
  // Accept any http(s) link — Hudl and school sites are valid sources too —
  // but reject obvious non-URLs so the server doesn't have to.
  return /^https?:\/\/\S+\.\S+/.test(trimmed);
}

/** 163 -> "2:43" */
export function durationLabel(seconds: number | null): string | null {
  if (seconds === null || seconds <= 0) return null;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}
