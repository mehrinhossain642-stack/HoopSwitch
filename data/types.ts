/**
 * HoopSwitch data model.
 *
 * Physical measurements are stored canonically in metric (cm / kg) and
 * converted to ft/in + lbs at the display layer only. See lib/units.ts.
 */

export type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C';

export type DominantHand = 'Left' | 'Right' | 'Ambidextrous';

export type PostingStatus = 'open' | 'in_review' | 'closed';

export type CareerStat = {
  season: string;
  team_name: string;
  gp: number;
  ppg: number;
  rpg: number;
  apg: number;
};

export type Highlight = {
  id: string;
  title: string;
  source_type: 'external';
  url: string;
  duration_seconds: number;
  thumbnail_url: string;
};

export type Player = {
  id: string;
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
  careerStats: CareerStat[];
  highlights: Highlight[];
};

export type Posting = {
  id: string;
  team_id: string;
  position: Position;
  ideal_height_cm: number;
  ideal_weight_kg: number;
  expected_minutes: number;
  status: PostingStatus;
  notes: string;
  /** Display headline, e.g. "Looking for a starting Point Guard". */
  headline: string;
  /** Relative-time string for the feed, e.g. "2h ago". Prototype-only. */
  posted_ago: string;
  applicant_count: number;
};

export type Team = {
  id: string;
  name: string;
  league: string;
  location: string;
  wins: number;
  losses: number;
  roster_size: number;
  coach_name: string;
  about: string;
  postings: Posting[];
};
