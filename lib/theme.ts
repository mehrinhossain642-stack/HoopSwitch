/**
 * Design tokens mirrored from tailwind.config.js, for the places RN needs raw
 * values instead of a className (shadows, icon colors, native tab bar props).
 */
export const COLORS = {
  primary: '#F04E23',
  primaryPress: '#D13F18',
  primarySoft: '#FEEDE8',

  ink: '#141518',
  ink900: '#0D0E11',
  ink800: '#1C1E23',
  ink700: '#2A2D34',
  ink600: '#3C4048',

  slate: '#5B616E',
  slateSoft: '#8A909C',

  surface: '#FFFFFF',
  bg: '#F4F5F7',
  mist: '#EFF1F4',
  border: '#E4E6EA',
  borderStrong: '#D2D7DE',

  good: '#1FA971',
  goodSoft: '#E7F7F0',
  partial: '#E8A33D',
  partialSoft: '#FDF4E7',
  danger: '#DC2626',
  dangerSoft: '#FDECEC',
} as const;

/**
 * Card shadow. Uses `boxShadow` rather than the `shadow*` family, which
 * RN 0.86 deprecates; boxShadow is supported on iOS, Android and web under the
 * New Architecture that SDK 57 requires.
 *
 * Deliberately tight — cards carry a 1px border for definition, so the shadow
 * only has to lift them off the background rather than do the whole job.
 */
export const CARD_SHADOW = {
  boxShadow: '0px 1px 2px rgba(20, 21, 24, 0.05)',
} as const;

/** For sheets, popovers and the dark header slab. */
export const RAISED_SHADOW = {
  boxShadow: '0px 6px 20px rgba(20, 21, 24, 0.10)',
} as const;

export const SLAB_SHADOW = {
  boxShadow: '0px 2px 14px rgba(13, 14, 17, 0.18)',
} as const;

export const FONTS = {
  display: 'Sora_700Bold',
  displaySemibold: 'Sora_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  /** Condensed scoreboard face for numerals and eyebrow labels. */
  stat: 'BebasNeue_400Regular',
} as const;

/** Micro-interaction timings. Kept short so the UI never feels laggy. */
export const MOTION = {
  fast: 120,
  base: 200,
  slow: 320,
} as const;

/**
 * Fit-score tiers. The server sends `good | partial`; both the color and the
 * verbal label live here so every surface describes a score the same way.
 */
export function tierColor(tier: 'good' | 'partial'): string {
  return tier === 'good' ? COLORS.good : COLORS.partial;
}

export function tierSoftColor(tier: 'good' | 'partial'): string {
  return tier === 'good' ? COLORS.goodSoft : COLORS.partialSoft;
}

export function tierLabel(tier: 'good' | 'partial'): string {
  return tier === 'good' ? 'Strong fit' : 'Partial fit';
}
