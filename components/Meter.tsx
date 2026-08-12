import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { COLORS, MOTION } from '../lib/theme';

type SegmentMeterProps = {
  /** 0–100. */
  score: number;
  color: string;
  segments?: number;
  height?: number;
};

/**
 * Discrete segment meter — the broadcast-graphic read on a fit score. Segments
 * light up left to right on mount, which makes the number feel measured rather
 * than decorative.
 */
export function SegmentMeter({ score, color, segments = 10, height = 7 }: SegmentMeterProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const filled = Math.max(1, Math.round((score / 100) * segments));

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: MOTION.slow,
      useNativeDriver: true,
    }).start();
  }, [progress, score]);

  return (
    <View className="flex-row items-center" accessibilityElementsHidden importantForAccessibility="no">
      {Array.from({ length: segments }, (_, index) => {
        const isFilled = index < filled;
        // Each segment brightens inside its own slice of the timeline, so the
        // fill sweeps rather than appearing all at once.
        const start = (index / segments) * 0.7;
        const opacity = isFilled
          ? progress.interpolate({
              inputRange: [start, Math.min(start + 0.3, 1)],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            })
          : 1;

        return (
          <Animated.View
            key={index}
            style={{
              flex: 1,
              height,
              marginRight: index === segments - 1 ? 0 : 3,
              borderRadius: 2,
              backgroundColor: isFilled ? color : COLORS.border,
              opacity,
            }}
          />
        );
      })}
    </View>
  );
}

type MeterProps = {
  /** 0–1. */
  value: number;
  color: string;
  height?: number;
  trackClassName?: string;
};

/**
 * Continuous bar for score components. Animates `scaleX` from the left edge
 * rather than `width`, so the fill never triggers a layout pass.
 */
export function Meter({ value, color, height = 6, trackClassName = 'bg-mist' }: MeterProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const clamped = Math.max(0.02, Math.min(value, 1));

  useEffect(() => {
    Animated.timing(progress, {
      toValue: clamped,
      duration: MOTION.slow,
      useNativeDriver: true,
    }).start();
  }, [progress, clamped]);

  return (
    <View className={`w-full overflow-hidden rounded-full ${trackClassName}`} style={{ height }}>
      <Animated.View
        style={{
          height,
          width: '100%',
          borderRadius: height / 2,
          backgroundColor: color,
          transform: [{ scaleX: progress }],
          transformOrigin: 'left center',
        }}
      />
    </View>
  );
}
