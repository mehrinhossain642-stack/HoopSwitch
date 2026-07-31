import type { Player, Position, Posting } from '../data/types';

export type MatchTier = 'good' | 'partial';

export type MatchResult = {
  score: number;
  tier: MatchTier;
  reason: string;
  /** Per-component 0–1 sub-scores, exposed for detail screens. */
  breakdown: {
    position: number;
    height: number;
    weight: number;
    production: number;
  };
};

const WEIGHTS = {
  position: 0.35,
  height: 0.25,
  weight: 0.15,
  production: 0.25,
} as const;

/** Tolerances: within this delta a component degrades linearly to 0. */
const HEIGHT_TOLERANCE_CM = 10;
const WEIGHT_TOLERANCE_KG = 8;
/** PPG that saturates the production component. */
const PRODUCTION_REFERENCE_PPG = 12;

const GOOD_TIER_THRESHOLD = 78;

const ADJACENT: Record<Position, readonly Position[]> = {
  PG: ['SG'],
  SG: ['PG', 'SF'],
  SF: ['SG', 'PF'],
  PF: ['SF', 'C'],
  C: ['PF'],
};

const REASONS = {
  position: 'different position than the slot',
  height: 'more height would help',
  weight: 'add strength to match the role',
  production: 'add scoring to stand out',
} as const;

type Component = keyof typeof WEIGHTS;

/** Exact 1.0, adjacent 0.5, otherwise 0. */
function positionScore(player: Position, ideal: Position): number {
  if (player === ideal) return 1;
  return ADJACENT[ideal].includes(player) ? 0.5 : 0;
}

/** One-sided: taller than ideal is never penalised. */
function heightScore(playerCm: number, idealCm: number): number {
  if (playerCm >= idealCm) return 1;
  return 1 - Math.min((idealCm - playerCm) / HEIGHT_TOLERANCE_CM, 1);
}

/** Symmetric: both lighter and heavier than ideal are penalised. */
function weightScore(playerKg: number, idealKg: number): number {
  return 1 - Math.min(Math.abs(playerKg - idealKg) / WEIGHT_TOLERANCE_KG, 1);
}

function productionScore(ppg: number): number {
  return Math.min(ppg / PRODUCTION_REFERENCE_PPG, 1);
}

/**
 * Scores a player against a posting. Drives both feeds: the player feed
 * scores every posting for the current player, the coach feed scores every
 * player against the selected posting.
 */
export function scoreMatch(player: Player, posting: Posting): MatchResult {
  const breakdown = {
    position: positionScore(player.position, posting.position),
    height: heightScore(player.height_cm, posting.ideal_height_cm),
    weight: weightScore(player.weight_kg, posting.ideal_weight_kg),
    production: productionScore(player.ppg),
  };

  const weighted =
    breakdown.position * WEIGHTS.position +
    breakdown.height * WEIGHTS.height +
    breakdown.weight * WEIGHTS.weight +
    breakdown.production * WEIGHTS.production;

  const score = Math.round(100 * weighted);
  const tier: MatchTier = score >= GOOD_TIER_THRESHOLD ? 'good' : 'partial';

  return {
    score,
    tier,
    reason: tier === 'good' ? 'Fits you well' : REASONS[weakestComponent(breakdown)],
    breakdown,
  };
}

/**
 * Lowest raw sub-score. Ties resolve in declaration order
 * (position, height, weight, production) so reasons stay deterministic.
 */
function weakestComponent(breakdown: MatchResult['breakdown']): Component {
  const order: Component[] = ['position', 'height', 'weight', 'production'];
  let weakest: Component = 'position';
  for (const component of order) {
    if (breakdown[component] < breakdown[weakest]) {
      weakest = component;
    }
  }
  return weakest;
}

/** Descending-score sort used by both feeds. Stable on ties via name/id. */
export function sortByMatch<T>(
  items: T[],
  score: (item: T) => number,
  tiebreak: (item: T) => string
): T[] {
  return [...items].sort((a, b) => {
    const delta = score(b) - score(a);
    return delta !== 0 ? delta : tiebreak(a).localeCompare(tiebreak(b));
  });
}
