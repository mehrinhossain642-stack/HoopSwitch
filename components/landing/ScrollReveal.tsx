import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, View, type StyleProp, type ViewStyle } from 'react-native';

/**
 * Fades and lifts a section into view as it is scrolled to.
 *
 * The landing page is web-only, so this leans on IntersectionObserver — on
 * react-native-web a `View` ref *is* the DOM node, so it can be observed
 * directly. Anywhere that API is missing (native, SSR, old browsers) the content
 * simply starts visible: a landing page that hides its copy when the observer is
 * unavailable would be worse than one that never animates.
 *
 * Honours `prefers-reduced-motion` by skipping the animation entirely.
 */
export function ScrollReveal({
  children,
  /** Stagger within a group, in ms. */
  delay = 0,
  /** How far it travels up. */
  distance = 24,
  className,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const hostRef = useRef<View | null>(null);
  const progress = useRef(new Animated.Value(0)).current;

  // Start visible unless we're somewhere the observer can actually run.
  const [animatable] = useState(
    () =>
      Platform.OS === 'web' &&
      typeof IntersectionObserver !== 'undefined' &&
      !(
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      )
  );

  useEffect(() => {
    if (!animatable) {
      progress.setValue(1);
      return;
    }

    // RNW hands back the DOM element for a View ref.
    const node = hostRef.current as unknown as Element | null;
    if (!node) {
      progress.setValue(1);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          Animated.timing(progress, {
            toValue: 1,
            duration: 520,
            delay,
            useNativeDriver: true,
          }).start();
          // One-shot: sections shouldn't re-animate on the way back up.
          observer.unobserve(entry.target);
        }
      },
      // Fires a little before the section is fully on screen, so the motion
      // reads as the page settling rather than as content popping in late.
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [animatable, delay, progress]);

  return (
    <View ref={hostRef} className={className} style={style}>
      <Animated.View
        style={{
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [distance, 0],
              }),
            },
          ],
        }}>
        {children}
      </Animated.View>
    </View>
  );
}

/**
 * Hero entrance. Runs on mount rather than on scroll — the hero is already in
 * view, so waiting for an intersection would mean a beat of blank page.
 */
export function HeroReveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const reduced =
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      progress.setValue(1);
      return;
    }

    Animated.timing(progress, {
      toValue: 1,
      duration: 620,
      delay,
      useNativeDriver: true,
    }).start();
  }, [delay, progress]);

  return (
    <Animated.View
      className={className}
      style={{
        opacity: progress,
        transform: [
          { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
        ],
      }}>
      {children}
    </Animated.View>
  );
}
