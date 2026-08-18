import { useColorScheme } from 'nativewind';

/**
 * Design tokens mirrored from tailwind.config.js / global.css, for the places RN
 * needs raw values instead of a className — Ionicons `color`, `RefreshControl`
 * `tintColor`, `ActivityIndicator`, `placeholderTextColor`.
 *
 * Anything that varies by theme must be read through `useThemeColors()`; a
 * module-level constant can't react to the colour scheme changing.
 */

type Palette = {
  bg: string;
  surface: string;
  surfaceRaised: string;
  mist: string;
  border: string;
  borderStrong: string;
  ink: string;
  slate: string;
  slateSoft: string;
  // Accents flip too: a #DC2626 glyph doesn't hold up on a dark tint, and the
  // pastel soft fills are unusable on near-black.
  primary: string;
  primarySoft: string;
  good: string;
  goodSoft: string;
  partial: string;
  partialSoft: string;
  danger: string;
  dangerSoft: string;
};

const LIGHT: Palette = {
  bg: '#F4F5F7',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  mist: '#EFF1F4',
  border: '#E4E6EA',
  borderStrong: '#D2D7DE',
  ink: '#141518',
  slate: '#5B616E',
  slateSoft: '#8A909C',
  primary: '#F04E23',
  primarySoft: '#FEEDE8',
  good: '#1FA971',
  goodSoft: '#E7F7F0',
  partial: '#E8A33D',
  partialSoft: '#FDF4E7',
  danger: '#DC2626',
  dangerSoft: '#FDECEC',
};

/** Must stay in sync with `.dark:root` in global.css. */
const DARK: Palette = {
  bg: '#15161A',
  surface: '#1E2025',
  surfaceRaised: '#24262C',
  mist: '#2A2D33',
  border: '#2E3138',
  borderStrong: '#3C4048',
  ink: '#F2F3F5',
  slate: '#A3A9B5',
  slateSoft: '#7C8391',
  primary: '#FF7452',
  primarySoft: '#3A211A',
  good: '#3FD293',
  goodSoft: '#16302A',
  partial: '#F5BE63',
  partialSoft: '#382C1B',
  danger: '#FF6B6B',
  dangerSoft: '#3A1F1F',
};

/**
 * The dark chrome — header slabs, nav rail. Near-constant across themes because
 * the chrome *is* the brand; in dark mode it only deepens, staying the lowest
 * surface so it still reads as chrome.
 */
export const CHROME = {
  base: '#0D0E11',
  raised: '#1C1E23',
  border: '#2A2D34',
  text: '#FFFFFF',
  textMuted: '#8A909C',
} as const;

/** Brand orange as an unchanging value, for the few places that need the literal. */
export const BRAND_ORANGE = '#F04E23';

export const PALETTES = { light: LIGHT, dark: DARK } as const;

export type ThemeColors = Palette & { chrome: string; chromeText: string; chromeTextMuted: string };

/**
 * Theme-aware raw colour values. Use this in components — never the static
 * `COLORS` export — anywhere the value lands on a themed surface.
 */
export function useThemeColors(): ThemeColors {
  const { colorScheme } = useColorScheme();
  const palette = colorScheme === 'dark' ? DARK : LIGHT;

  return {
    ...palette,
    chrome: CHROME.base,
    chromeText: CHROME.text,
    chromeTextMuted: CHROME.textMuted,
  };
}

/**
 * Static light-mode palette.
 *
 * Correct only for values that can't be theme-aware — module scope, or content
 * that always sits on the ink chrome (which doesn't flip). Prefer
 * `useThemeColors()` inside components.
 */
export const COLORS = {
  ...LIGHT,
  chrome: CHROME.base,
  chromeRaised: CHROME.raised,
  chromeBorder: CHROME.border,
  chromeText: CHROME.text,
  chromeTextMuted: CHROME.textMuted,
} as const;

/**
 * Card shadow. Uses `boxShadow` rather than the `shadow*` family, which RN 0.86
 * deprecates; boxShadow is supported on iOS, Android and web under the New
 * Architecture that SDK 57 requires.
 *
 * Deliberately tight — cards carry a 1px border for definition, so the shadow only
 * has to lift them off the background rather than do the whole job.
 */
export const CARD_SHADOW = {
  boxShadow: '0px 1px 2px rgba(20, 21, 24, 0.05)',
} as const;

/** Modal scrim — heavy enough that the foreground clearly owns the screen. */
export const SCRIM = 'rgba(9,10,12,0.62)';

export const FONTS = {
  display: 'Sora_700Bold',
  displaySemibold: 'Sora_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  stat: 'BarlowCondensed_600SemiBold',
  statMedium: 'BarlowCondensed_500Medium',
  statBold: 'BarlowCondensed_700Bold',
} as const;

/** Micro-interaction timings. Kept short so the UI never feels laggy. */
export const MOTION = {
  fast: 120,
  base: 200,
  slow: 320,
} as const;

export type Tier = 'good' | 'partial';

/**
 * Fit-score tiers. Colour and wording live together so every surface describes a
 * score the same way — and the label means the tier survives for anyone who can't
 * separate the green from the amber.
 */
export function tierLabel(tier: Tier): string {
  return tier === 'good' ? 'Strong fit' : 'Partial fit';
}

/** Theme-aware tier colours, for card rails and score displays. */
export function useTierColors() {
  const colors = useThemeColors();

  return {
    color: (tier: Tier) => (tier === 'good' ? colors.good : colors.partial),
    soft: (tier: Tier) => (tier === 'good' ? colors.goodSoft : colors.partialSoft),
    label: tierLabel,
  };
}
