import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS, useThemeColors } from '../lib/theme';
import { useThemePreference } from '../lib/themePreference';
import { Touchable } from './Touchable';

/**
 * Compact light/dark switch for places with no settings screen behind them —
 * the landing page, chiefly.
 *
 * Two states rather than the settings screen's three: a single icon can't make
 * "Auto" legible, and someone reaching for this wants the theme to change now.
 * Tapping therefore commits an explicit preference. Auto stays available in
 * Settings, and the choice persists, so a visitor who flips to dark here keeps it
 * through signup and into the app.
 */
export function ThemeToggleButton({ onDark = false }: { onDark?: boolean }) {
  const { resolved, setPreference } = useThemePreference();
  const colors = useThemeColors();

  // Starting from whatever is *resolved* means the first tap does the obvious
  // thing even when the current preference is "follow my device".
  const next = resolved === 'dark' ? 'light' : 'dark';

  return (
    <Touchable
      onPress={() => setPreference(next)}
      hitSlop={8}
      accessibilityRole="button"
      // The label names the outcome; the icon alone can't say which way it goes.
      accessibilityLabel={`Switch to ${next} theme`}
      className={`h-10 w-10 items-center justify-center rounded-full ${
        onDark ? 'bg-chrome-raised' : 'bg-mist'
      }`}>
      {/* Shows the state you're switching *to*, matching the label. */}
      <Ionicons
        name={next === 'light' ? 'sunny-outline' : 'moon-outline'}
        size={18}
        color={onDark ? COLORS.chromeText : colors.ink}
      />
    </Touchable>
  );
}
