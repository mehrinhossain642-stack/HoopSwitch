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
  /** Scale at full press. 1 disables the scale entirely. */
  scaleTo?: number;
  /** Opacity at full press. */
  dimTo?: number;
  children: React.ReactNode;
};

/**
 * The app's only press primitive. Every tappable surface goes through it so
 * feedback timing is identical everywhere, and so web gets a pointer cursor
 * without each caller remembering to add one.
 *
 * Animates transform/opacity only — never layout — so a press can't reflow the
 * row it lives in.
 */
export function Touchable({
  className = '',
  style,
  scaleTo = 0.97,
  dimTo = 0.9,
  disabled,
  children,
  ...rest
}: TouchableProps) {
  const progress = useRef(new Animated.Value(0)).current;

  function animateTo(value: number) {
    Animated.timing(progress, {
      toValue: value,
      // Release reads as snappier than press, per the exit-faster-than-enter rule.
      duration: value === 1 ? MOTION.fast : MOTION.fast * 0.8,
      useNativeDriver: true,
    }).start();
  }

  const animatedStyle = {
    opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [1, dimTo] }),
    transform: [
      { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, scaleTo] }) },
    ],
  };

  return (
    <Pressable
      disabled={disabled}
      onPressIn={() => animateTo(1)}
      onPressOut={() => animateTo(0)}
      // RN Web leaves the default arrow cursor on pressables; without this,
      // nothing in the browser build looks clickable.
      style={[
        Platform.OS === 'web' && !disabled ? ({ cursor: 'pointer' } as ViewStyle) : null,
        style,
      ]}
      {...rest}>
      <Animated.View className={className} style={disabled ? undefined : animatedStyle}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

type RevealProps = {
  /** Staggers the entrance. Index in a list works directly. */
  index?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

/**
 * Fade-and-rise entrance for list and section content. Uses plain Animated
 * rather than Reanimated layout animations so it behaves the same in the
 * browser build as on device.
 */
export function Reveal({ index = 0, className = '', style, children }: RevealProps) {
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
