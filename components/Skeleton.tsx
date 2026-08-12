import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

/**
 * Pulsing placeholder block. Skeletons rather than a centred spinner: the feed
 * keeps its shape while loading, so nothing jumps when data lands.
 */
export function Skeleton({
  width,
  height,
  radius = 6,
  className = '',
}: {
  width?: number | `${number}%`;
  height: number;
  radius?: number;
  className?: string;
}) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 750,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 750,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      className={`bg-mist ${className}`}
      style={{
        width: width ?? '100%',
        height,
        borderRadius: radius,
        opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
      }}
    />
  );
}

/** Placeholder shaped like a feed card, so the first paint matches the second. */
export function FeedCardSkeleton() {
  return (
    <View className="mb-3 overflow-hidden rounded-card border border-border bg-surface">
      <View className="flex-row items-center p-4">
        <Skeleton width={40} height={40} radius={10} />
        <View className="ml-3 flex-1">
          <Skeleton width="55%" height={13} />
          <View className="h-2" />
          <Skeleton width="35%" height={10} />
        </View>
      </View>

      <View className="px-4 pb-4">
        <Skeleton width="80%" height={16} />
        <View className="h-3" />
        <Skeleton height={46} radius={10} />
      </View>

      <View className="border-t border-border bg-bg p-4">
        <Skeleton width="45%" height={26} />
      </View>
    </View>
  );
}

export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View accessibilityLabel="Loading">
      {Array.from({ length: count }, (_, index) => (
        <FeedCardSkeleton key={index} />
      ))}
    </View>
  );
}
