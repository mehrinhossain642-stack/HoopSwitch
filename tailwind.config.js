/** @type {import('tailwindcss').Config} */

/** Wraps a semantic token from global.css so opacity modifiers still work. */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  // Must be 'class', not the default 'media'. NativeWind's web runtime observes
  // <head> for the injected stylesheet and then calls colorScheme.set(), which
  // throws outright when darkMode is 'media'. It's also what a user-selectable
  // toggle needs — colorScheme.set() flips this class.
  darkMode: 'class',
  theme: {
    // Mobile-first. `lg` is the phone→desktop switch: below it the app uses
    // bottom tabs and full-bleed content, at and above it a left nav rail and a
    // capped content column.
    screens: {
      sm: '480px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    extend: {
      colors: {
        // --- theme-aware (resolve through global.css) ---
        bg: token('bg'),
        surface: token('surface'),
        'surface-raised': token('surface-raised'),
        mist: token('mist'),
        border: token('border'),
        'border-strong': token('border-strong'),
        ink: token('text'),
        slate: token('text-muted'),
        'slate-soft': token('text-subtle'),
        chrome: token('chrome'),
        'chrome-raised': token('chrome-raised'),
        'chrome-border': token('chrome-border'),
        'chrome-text': token('chrome-text'),
        'chrome-text-muted': token('chrome-text-muted'),
        scrim: token('scrim'),

        // --- accents (also theme-aware: they lift in dark mode) ---
        primary: token('primary'),
        'primary-soft': token('primary-soft'),
        good: token('good'),
        'good-soft': token('good-soft'),
        partial: token('partial'),
        'partial-soft': token('partial-soft'),
        // Destructive actions. Kept separate from `primary` so brand orange never
        // has to double as a warning colour.
        danger: token('danger'),
        'danger-soft': token('danger-soft'),

        // Pressed state for the primary fill — no dark variant needed, it's only
        // ever composited under a press animation.
        'primary-press': '#D13F18',
      },
      fontFamily: {
        // Body / UI
        sans: ['Inter_400Regular'],
        'sans-medium': ['Inter_500Medium'],
        'sans-semibold': ['Inter_600SemiBold'],
        'sans-bold': ['Inter_700Bold'],
        // Headlines
        display: ['Sora_700Bold'],
        'display-semibold': ['Sora_600SemiBold'],
        // Condensed athletic face — stat numerals, scores, eyebrow labels.
        stat: ['BarlowCondensed_600SemiBold'],
        'stat-medium': ['BarlowCondensed_500Medium'],
        'stat-bold': ['BarlowCondensed_700Bold'],
      },
      borderRadius: {
        badge: '6px',
        md: '10px',
        btn: '12px',
        card: '14px',
        sheet: '20px',
      },
      boxShadow: {
        // Crisp and tight — cards carry a real 1px border and only a hint of
        // shadow, rather than the blurry drop shadow that reads as a default.
        card: '0px 1px 2px rgba(20, 21, 24, 0.05)',
        raised: '0px 6px 20px rgba(20, 21, 24, 0.10)',
        slab: '0px 2px 14px rgba(13, 14, 17, 0.18)',
      },
      letterSpacing: {
        eyebrow: '1.2px',
        stat: '0.3px',
      },
    },
  },
  plugins: [],
};
