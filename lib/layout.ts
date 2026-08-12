import { Platform, useWindowDimensions } from 'react-native';

/** Matches the `screens` block in tailwind.config.js. */
export const BREAKPOINTS = {
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

/**
 * Widest the content column ever gets. Feed cards and forms stop scaling here
 * and centre instead — a 2560px-wide list row is unreadable, and letting it
 * happen is the clearest sign an app was only ever checked on a phone.
 */
export const CONTENT_MAX_WIDTH = 720;

/** Wider cap for the two-column desktop layouts (profile, detail pages). */
export const WIDE_CONTENT_MAX_WIDTH = 1080;

export type LayoutInfo = {
  width: number;
  /** True from `md` up — tablets and browser windows. */
  isTablet: boolean;
  /**
   * True from `lg` up. This is the navigation switch: bottom tabs below,
   * a persistent left nav rail at and above.
   */
  isDesktop: boolean;
  /** Horizontal page gutter, widened on bigger viewports. */
  gutter: number;
  isWeb: boolean;
};

/**
 * Single source of truth for responsive decisions, so components don't each
 * invent their own threshold. Re-renders on rotation and browser resize.
 */
export function useLayout(): LayoutInfo {
  const { width } = useWindowDimensions();

  return {
    width,
    isTablet: width >= BREAKPOINTS.md,
    isDesktop: width >= BREAKPOINTS.lg,
    gutter: width >= BREAKPOINTS.md ? 28 : width >= BREAKPOINTS.sm ? 22 : 18,
    isWeb: Platform.OS === 'web',
  };
}
