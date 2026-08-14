/**
 * Design tokens mirrored from tailwind.config.js, for the places RN needs raw
 * values instead of a className (shadows, icon colors, native tab bar props).
 */
export const COLORS = {
  primary: '#F04E23',
  ink: '#141518',
  slate: '#5B616E',
  surface: '#FFFFFF',
  bg: '#F4F5F7',
  border: '#E4E6EA',
  good: '#1FA971',
  partial: '#E8A33D',
  danger: '#DC2626',
  dangerSoft: '#FDECEC',
} as const;

/**
 * Soft card shadow. Uses `boxShadow` rather than the `shadow*` family, which
 * RN 0.86 deprecates; boxShadow is supported on iOS, Android and web under the
 * New Architecture that SDK 57 requires.
 */
export const CARD_SHADOW = {
  boxShadow: '0px 2px 10px rgba(20, 21, 24, 0.06)',
} as const;

export const FONTS = {
  display: 'Sora_700Bold',
  displaySemibold: 'Sora_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
} as const;
