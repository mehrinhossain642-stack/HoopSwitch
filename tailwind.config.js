/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  // Must be 'class', not the default 'media'. NativeWind's web runtime observes
  // <head> for the injected stylesheet and then calls colorScheme.set(), which
  // throws outright when darkMode is 'media'. The app is light-only, so this
  // just means dark mode stays opt-in via a `dark` class we never add.
  darkMode: 'class',
  theme: {
    // Mobile-first. `lg` is the phone→desktop switch: below it the app uses
    // bottom tabs and full-bleed content, at and above it a left nav rail and
    // a capped content column.
    screens: {
      sm: '480px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    extend: {
      colors: {
        // Brand orange is reserved for brand marks and the primary action.
        // Errors use `danger` so orange never means two things at once.
        primary: '#F04E23',
        'primary-press': '#D13F18',
        'primary-soft': '#FEEDE8',

        // Dark ramp. `ink` is body headline text; 900/800/700 are surfaces and
        // dividers for the header slabs and dark panels.
        ink: '#141518',
        'ink-900': '#0D0E11',
        'ink-800': '#1C1E23',
        'ink-700': '#2A2D34',
        'ink-600': '#3C4048',

        slate: '#5B616E',
        'slate-soft': '#8A909C',

        surface: '#FFFFFF',
        bg: '#F4F5F7',
        // Subtle fill for spec strips and table zebra inside white cards.
        mist: '#EFF1F4',
        border: '#E4E6EA',
        'border-strong': '#D2D7DE',

        good: '#1FA971',
        'good-soft': '#E7F7F0',
        partial: '#E8A33D',
        'partial-soft': '#FDF4E7',
        danger: '#DC2626',
        'danger-soft': '#FDECEC',
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
        // Condensed scoreboard face — stat numerals, fit scores, eyebrow labels.
        stat: ['BebasNeue_400Regular'],
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
        rail: '1px 0px 0px rgba(228, 230, 234, 1)',
      },
      letterSpacing: {
        eyebrow: '1.4px',
        stat: '0.4px',
      },
    },
  },
  plugins: [],
};
