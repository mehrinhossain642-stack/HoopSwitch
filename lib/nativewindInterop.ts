import { cssInterop } from 'nativewind';
import { Animated } from 'react-native';

/**
 * Teaches NativeWind to style `Animated.View` from `className`.
 *
 * NativeWind registers its interop against React Native's own components, and
 * `Animated.View` is a wrapper around `View` rather than `View` itself — so
 * without this, `className` on an animated view is **silently dropped**. No
 * warning, no error, just missing styles:
 *
 *   - skeleton placeholders lost their `bg-mist` fill and rendered invisible
 *   - the launch screen's progress bar lost `bg-primary`
 *   - reveal wrappers lost their spacing classes
 *
 * Anything animated needs a className somewhere, so fixing it centrally beats
 * remembering to wrap every animated view in a plain one.
 *
 * Imported for its side effect by the root layout, before any screen renders.
 */
cssInterop(Animated.View, { className: 'style' });
