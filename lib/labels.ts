import type { Position } from '../data/types';

export const POSITION_LABEL: Record<Position, string> = {
  PG: 'Point Guard',
  SG: 'Shooting Guard',
  SF: 'Small Forward',
  PF: 'Power Forward',
  C: 'Centre',
};

/** "Starting PG" / "Backup PG" style label derived from expected minutes. */
export function roleLabel(position: Position, expectedMinutes: number): string {
  const tier = expectedMinutes >= 24 ? 'Starting' : expectedMinutes >= 14 ? 'Rotation' : 'Depth';
  return `${tier} ${position}`;
}
