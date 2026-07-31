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
    extend: {
      colors: {
        primary: '#F04E23',
        ink: '#141518',
        slate: '#5B616E',
        surface: '#FFFFFF',
        bg: '#F4F5F7',
        border: '#E4E6EA',
        good: '#1FA971',
        partial: '#E8A33D',
      },
      fontFamily: {
        // Body / UI
        sans: ['Inter_400Regular'],
        'sans-medium': ['Inter_500Medium'],
        'sans-semibold': ['Inter_600SemiBold'],
        'sans-bold': ['Inter_700Bold'],
        // Headers / stat numbers (bold condensed)
        display: ['Sora_700Bold'],
        'display-semibold': ['Sora_600SemiBold'],
      },
      borderRadius: {
        card: '16px',
        btn: '14px',
      },
      boxShadow: {
        card: '0px 2px 10px rgba(20, 21, 24, 0.06)',
      },
    },
  },
  plugins: [],
};
