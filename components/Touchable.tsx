import { useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { MOTION } from '../lib/theme';

type TouchableProps = Omit<PressableProps, 'style' | 'children'> & {
  className?: string;
  style?: StyleProp<ViewStyle>;
  /** Scale at full press. 1 disables the scale. */
  scaleTo?: number;
  /** Opacity at full press. */
  dimTo?: number;
  children: React.ReactNode;
};

/**
 * The app's only press primitive. Everything tappable goes through it so feedback
 * is identical everywhere, and so the web build gets a pointer cursor without
 * each caller remembering one.
 *
 * `className`, `style` and the press feedback all land on the *same* Pressable.
 * That matters more than it sounds: an earlier version put className on an inner
 * animated wrapper, which meant `flex-1` and `flex-row` never reached the box the
 * parent actually lays out — collapsing the tab bar and the filter chip rows — and
 * a caller pairing inline `borderWidth` with a border colour class got the two on
 * different elements.
 *
 * Feedback comes from Pressable's own style callback rather than an Animated
 * wrapper for the same reason. Only `opacity` and `transform` are returned from
 * it; NativeWind drops a `backgroundColor` returned from a style function.
 */
export function Touchable({
  className,
  style,
  scaleTo = 0.97,
  dimTo = 0.9,
  disabled,
  children,
  ...rest
}: TouchableProps) {
  return (
    <Pressable
      disabled={disabled}
      className={className}
      style={({ pressed }) => [
        // RN Web leaves the default arrow cursor on pressables; without this,
        // nothing in the browser build looks clickable.
        Platform.OS === 'web' && !disabled ? ({ cursor: 'pointer' } as ViewStyle) : null,
        pressed && !disabled
          ? { opacity: dimTo, transform: [{ scale: scaleTo }] }
          : null,
        style,
      ]}
      {...rest}>
      {children}
    </Pressable>
  );
}

type RevealProps = {
  /** Staggers the entrance. A list index works directly. */
  index?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

/**
 * Fade-and-rise entrance for list and section content. Uses plain `Animated`
 * rather than Reanimated layout animations so the browser build behaves the same
 * as the device one.
 */
export function Reveal({ index = 0, className, style, children }: RevealProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const started = useRef(false);

  if (!started.current) {
    started.current = true;
    Animated.timing(progress, {
      toValue: 1,
      duration: MOTION.slow,
      // 40ms per item, capped so a long list's tail doesn't crawl in.
      delay: Math.min(index, 8) * 40,
      useNativeDriver: true,
    }).start();
  }

  return (
    <Animated.View
      className={className}
      style={[
        {
          opacity: progress,
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
          ],
        },
        style,
      ]}>
      {children}
    </Animated.View>
  );
}
