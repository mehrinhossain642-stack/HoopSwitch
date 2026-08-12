import Constants from 'expo-constants';
import type { DominantHand, Position, PostingStatus } from '../data/types';

export type UserRole = 'player' | 'coach';

/** Port the Rails API listens on. See api/README.md. */
const API_PORT = 3001;

/**
 * Hosts that mean "Expo is tunnelling Metro". A tunnel only forwards Metro's
 * port (8081) — there is no route to the API's port through it, so deriving the
 * API URL from one produces a host that silently never answers.
 */
const TUNNEL_HOST = /\.exp\.direct$|\.ngrok(-free)?\.(io|app|dev)$|\.trycloudflare\.com$|\.loca\.lt$/;

type BaseUrl = { url: string; problem: null } | { url: null; problem: string };

/**
 * Resolve the API host.
 *
 * `localhost` is wrong on a physical device — in Expo Go it resolves to the
 * phone itself, not the laptop running Rails. Expo exposes the dev server's
 * host (the machine's LAN IP on device, `localhost` on web/simulator) via
 * `hostUri`, so we reuse it and just swap the port.
 *
 * Override with EXPO_PUBLIC_API_URL to point at a tunnelled or deployed API.
 */
function resolveBaseUrl(): BaseUrl {
  const override = process.env.EXPO_PUBLIC_API_URL;
  if (override) return { url: override.replace(/\/$/, ''), problem: null };

  const expoGoConfig = Constants.expoGoConfig as { debuggerHost?: string } | undefined;
  const hostUri = Constants.expoConfig?.hostUri ?? expoGoConfig?.debuggerHost;
  const host = hostUri?.split(':')[0];

  if (host && TUNNEL_HOST.test(host)) {
    return {
      url: null,
      problem:
        `Expo is running through a tunnel (${host}), which only forwards Metro — ` +
        `port ${API_PORT} isn't reachable through it.\n\n` +
        `Either run "npx expo start" without --tunnel (phone and laptop on the same Wi-Fi), ` +
        `or expose the API yourself and set EXPO_PUBLIC_API_URL to that public URL.`,
    };
  }

  return { url: host ? `http://${host}:${API_PORT}` : `http://localhost:${API_PORT}`, problem: null };
}

const resolved = resolveBaseUrl();

/** Null when the environment can't reach the API at all — see `BASE_URL_PROBLEM`. */
export const API_BASE_URL = resolved.url;
export const BASE_URL_PROBLEM = resolved.problem;

/** Thrown for any non-2xx response, carrying the server's messages. */
export class ApiError extends Error {
  readonly status: number;
  readonly errors: string[];

  constructor(status: number, errors: string[]) {
    super(errors[0] ?? `Request failed (${status})`);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
  /** Set when the caller needs the Authorization header off the response. */
  wantAuthHeader?: boolean;
};

type RawResponse<T> = { data: T; authorization: string | null };

async function request<T>(path: string, options: RequestOptions = {}): Promise<RawResponse<T>> {
  const { method = 'GET', body, token } = options;

  // Fail with the actual reason rather than firing a request at a host that
  // can't answer (the tunnel case produces a valid-looking but dead URL).
  if (API_BASE_URL === null) {
    throw new ApiError(0, [BASE_URL_PROBLEM ?? 'API host could not be determined']);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: token } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // fetch only rejects on network failure — surface something actionable.
    throw new ApiError(0, [`Can't reach the API at ${API_BASE_URL}. Is the Rails server running?`]);
  }

  if (response.status === 204) {
    return { data: undefined as T, authorization: response.headers.get('Authorization') };
  }

  const text = await response.text();
  const parsed = text.length > 0 ? safeJsonParse(text) : null;

  if (!response.ok) {
    const errors = Array.isArray(parsed?.errors)
      ? (parsed.errors as string[])
      : [parsed?.error ?? `Request failed (${response.status})`];
    throw new ApiError(response.status, errors);
  }

  return { data: parsed as T, authorization: response.headers.get('Authorization') };
}

function safeJsonParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Convenience wrapper for the common case where only the body matters. */
async function json<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { data } = await request<T>(path, options);
  return data;
}

// --- shared payload types (mirror the Rails serializers) --------------------

export type ApiMatch = {
  score: number;
  tier: 'good' | 'partial';
  reason: string;
  breakdown: { position: number; height: number; weight: number; production: number };
};

export type ApiCareerStat = {
  id: number;
  season: string;
  team_name: string;
  gp: number;
  ppg: number;
  rpg: number;
  apg: number;
};

export type ApiHighlight = {
  id: number;
  title: string;
  source_type: 'external' | 'uploaded';
  url: string;
  duration_seconds: number | null;
  thumbnail_url: string | null;
};

export type ApiPlayer = {
  id: number;
  name: string;
  position: Position;
  height_cm: number;
  weight_kg: number;
  wingspan_cm: number;
  age: number;
  dominant_hand: DominantHand;
  eligibility_years: number;
  location: string | null;
  bio: string | null;
  ppg: number;
  rpg: number;
  apg: number;
  fg_pct: number;
  career_stats: ApiCareerStat[];
  highlights: ApiHighlight[];
  // Collected by the 4-step onboarding flow.
  school: string | null;
  graduation_year: number | null;
  grade: string | null;
  city: string | null;
  province: string | null;
  secondary_position: Position | null;
  current_team: string | null;
  goals: PlayerGoal[];
  short_term_goal: string | null;
  onboarding_complete: boolean;
  match?: ApiMatch;
  connected?: boolean;
};

/** Goal keys are stable server-side; labels live in the onboarding screen. */
export type PlayerGoal = 'u_sports' | 'ncaa' | 'professional' | 'skills' | 'exposure';

export type ApiTeam = {
  id: number;
  name: string;
  league: string | null;
  location: string | null;
  wins: number;
  losses: number;
  record: string;
  roster_size: number;
  coach_name: string | null;
  about: string | null;
  logo_url: string | null;
  open_slots_count?: number;
  postings?: ApiPosting[];
};

export type ApiPosting = {
  id: number;
  team_id: number;
  position: Position;
  ideal_height_cm: number;
  ideal_weight_kg: number;
  expected_minutes: number;
  status: PostingStatus;
  notes: string | null;
  headline: string | null;
  applicant_count: number;
  created_at: string;
  team?: ApiTeam;
  match?: ApiMatch;
  connected?: boolean;
};

export type ApiConnection = {
  id: number;
  posting_id: number;
  player_profile_id: number;
  initiated_by: UserRole;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
};

export type ApiUser = {
  id: number;
  email: string;
  role: UserRole;
  player_profile_id: number | null;
  team_id: number | null;
};

export type AuthResult = { user: ApiUser; token: string };

// --- auth -------------------------------------------------------------------

function extractToken(authorization: string | null): string {
  if (!authorization) {
    throw new ApiError(500, ['No Authorization header returned by the server']);
  }
  return authorization;
}

export async function signup(
  email: string,
  password: string,
  passwordConfirmation: string,
  role: UserRole
): Promise<AuthResult> {
  const { data, authorization } = await request<{ user: ApiUser }>('/signup', {
    method: 'POST',
    body: { user: { email, password, password_confirmation: passwordConfirmation, role } },
  });

  return { user: data.user, token: extractToken(authorization) };
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const { data, authorization } = await request<{ user: ApiUser }>('/login', {
    method: 'POST',
    body: { user: { email, password } },
  });

  return { user: data.user, token: extractToken(authorization) };
}

export async function logout(token: string): Promise<void> {
  await request('/logout', { method: 'DELETE', token });
}

// --- player -----------------------------------------------------------------

export function getProfile(token: string): Promise<ApiPlayer> {
  return json<ApiPlayer>('/profile', { token });
}

export type ProfilePatch = Partial<{
  name: string;
  position: Position;
  height_cm: number;
  weight_kg: number;
  wingspan_cm: number;
  age: number;
  dominant_hand: DominantHand;
  eligibility_years: number;
  location: string;
  bio: string;
  ppg: number;
  rpg: number;
  apg: number;
  fg_pct: number;
  // Onboarding
  school: string;
  graduation_year: number;
  grade: string;
  city: string;
  province: string;
  secondary_position: Position | null;
  current_team: string;
  goals: PlayerGoal[];
  short_term_goal: string;
}>;

export function updateProfile(token: string, patch: ProfilePatch): Promise<ApiPlayer> {
  return json<ApiPlayer>('/profile', { method: 'PATCH', token, body: { profile: patch } });
}

/** Marks the 4-step flow finished so the client stops routing into it. */
export function completeOnboarding(token: string): Promise<ApiPlayer> {
  return json<ApiPlayer>('/profile/complete_onboarding', { method: 'POST', token });
}

export function addHighlight(
  token: string,
  highlight: { title: string; url: string; duration_seconds?: number; thumbnail_url?: string }
): Promise<ApiHighlight> {
  return json<ApiHighlight>('/highlights', { method: 'POST', token, body: { highlight } });
}

export function deleteHighlight(token: string, id: number): Promise<void> {
  return json<void>(`/highlights/${id}`, { method: 'DELETE', token });
}

// --- coach ------------------------------------------------------------------

export function getTeam(token: string): Promise<ApiTeam> {
  return json<ApiTeam>('/team', { token });
}

export type TeamPatch = Partial<{
  name: string;
  league: string;
  location: string;
  wins: number;
  losses: number;
  roster_size: number;
  coach_name: string;
  about: string;
}>;

export function updateTeam(token: string, patch: TeamPatch): Promise<ApiTeam> {
  return json<ApiTeam>('/team', { method: 'PATCH', token, body: { team: patch } });
}

export type PostingPatch = Partial<{
  position: Position;
  ideal_height_cm: number;
  ideal_weight_kg: number;
  expected_minutes: number;
  status: PostingStatus;
  notes: string;
  headline: string;
}>;

export function createPosting(token: string, posting: PostingPatch): Promise<ApiPosting> {
  return json<ApiPosting>('/postings', { method: 'POST', token, body: { posting } });
}

export function updatePosting(
  token: string,
  id: number,
  patch: PostingPatch
): Promise<ApiPosting> {
  return json<ApiPosting>(`/postings/${id}`, { method: 'PATCH', token, body: { posting: patch } });
}

export function deletePosting(token: string, id: number): Promise<void> {
  return json<void>(`/postings/${id}`, { method: 'DELETE', token });
}

// --- feeds (both scored server-side) ----------------------------------------

export function getPostingFeed(
  token: string
): Promise<{ player_id: number; postings: ApiPosting[] }> {
  return json('/feed/postings', { token });
}

export function getPlayerFeed(
  token: string,
  postingId?: number
): Promise<{ posting: ApiPosting; players: ApiPlayer[] }> {
  const query = postingId === undefined ? '' : `?posting_id=${postingId}`;
  return json(`/feed/players${query}`, { token });
}

// --- connections (apply / invite) -------------------------------------------

export function listConnections(token: string): Promise<{ connections: ApiConnection[] }> {
  return json('/connections', { token });
}

/** Player applying: pass only the posting. Coach inviting: pass both. */
export function createConnection(
  token: string,
  postingId: number,
  playerProfileId?: number
): Promise<ApiConnection> {
  return json<ApiConnection>('/connections', {
    method: 'POST',
    token,
    body: {
      connection: {
        posting_id: postingId,
        ...(playerProfileId === undefined ? {} : { player_profile_id: playerProfileId }),
      },
    },
  });
}

export function respondToConnection(
  token: string,
  id: number,
  status: 'accepted' | 'declined'
): Promise<ApiConnection> {
  return json<ApiConnection>(`/connections/${id}`, {
    method: 'PATCH',
    token,
    body: { connection: { status } },
  });
}
