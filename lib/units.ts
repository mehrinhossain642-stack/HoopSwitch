/**
 * Display converters. Canonical storage is metric (cm / kg); every screen
 * renders imperial, so conversion lives here rather than in components.
 */

const CM_PER_INCH = 2.54;
const LBS_PER_KG = 2.20462;

/** 188 -> `6'2"` */
export function cmToFeetInches(cm: number): string {
  const totalInches = Math.round(cm / CM_PER_INCH);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}'${inches}"`;
}

/** 84 -> `185 lbs` */
export function kgToLbsLabel(kg: number): string {
  return `${Math.round(kg * LBS_PER_KG)} lbs`;
}

/** 84 -> 185 */
export function kgToLbs(kg: number): number {
  return Math.round(kg * LBS_PER_KG);
}

/** `6'2"` / `6 2` / `74` (inches) -> cm. Returns null when unparseable. */
export function parseHeightToCm(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed.length === 0) return null;

  // Feet + inches, e.g. 6'2", 6' 2, 6-2, 6 2
  const feetInches = trimmed.match(/^(\d+)\s*(?:'|ft|-|\s)\s*(\d+(?:\.\d+)?)?\s*(?:"|in)?$/i);
  if (feetInches && feetInches[1] !== undefined) {
    const feet = Number(feetInches[1]);
    const inches = feetInches[2] !== undefined ? Number(feetInches[2]) : 0;
    if (Number.isFinite(feet) && Number.isFinite(inches)) {
      return Math.round((feet * 12 + inches) * CM_PER_INCH);
    }
  }

  // Bare feet, e.g. 6'
  const feetOnly = trimmed.match(/^(\d+)\s*'$/);
  if (feetOnly && feetOnly[1] !== undefined) {
    return Math.round(Number(feetOnly[1]) * 12 * CM_PER_INCH);
  }

  // Bare number: treat as total inches
  const bare = Number(trimmed.replace(/["in]/gi, '').trim());
  if (Number.isFinite(bare) && bare > 0) {
    return Math.round(bare * CM_PER_INCH);
  }

  return null;
}

/** `185 lbs` / `185` -> kg. Returns null when unparseable. */
export function parseLbsToKg(input: string): number | null {
  const lbs = Number(input.replace(/lbs?|pounds?/gi, '').trim());
  if (!Number.isFinite(lbs) || lbs <= 0) return null;
  return Math.round((lbs / LBS_PER_KG) * 10) / 10;
}

/** 48 -> `48%` */
export function pctLabel(value: number): string {
  return `${Math.round(value)}%`;
}
