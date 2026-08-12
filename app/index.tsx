import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSession } from '../lib/session';

export default function SplashScreen() {
  const { user, restoring, landingRoute } = useSession();

  // A stored session should skip the sign-in gate entirely — otherwise
  // persisting the JWT buys nothing and every cold start asks for a password.
  // A player who abandoned onboarding resumes it instead of entering the app.
  useEffect(() => {
    if (restoring || !user) return;

    let cancelled = false;
    landingRoute().then((route) => {
      if (!cancelled) router.replace(route);
    });
    return () => {
      cancelled = true;
    };
  }, [restoring, user, landingRoute]);

  return (
    <View className="flex-1 items-center justify-center bg-black">
      {/* Exact Figma frame: 300 x 650 */}
      <View
        style={{
          width: 300,
          height: 650,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <ImageBackground
          source={require('../assets/splash-bg.png')}
          resizeMode="cover"
          style={{
            width: '100%',
            height: '100%',
          }}
        >
          {/* Dark overlay */}
          <View
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: 'rgba(0,0,0,0.50)',
              },
            ]}
          />

          {/* Main content */}
          <View
            style={{
              position: 'absolute',
              top: 145,
              left: 0,
              right: 0,
              alignItems: 'center',
            }}
          >
            {/* Basketball icon */}
            <Image
              source={require('../assets/hoopswitch-icon.png')}
              resizeMode="contain"
              style={{
                width: 62,
                height: 62,
              }}
            />

            {/* Orange line */}
            <View
              style={{
                width: 43,
                height: 4,
                borderRadius: 20,
                backgroundColor: '#FA4B21',
                marginTop: 18,
              }}
            />

            {/* HOOPSWITCH */}
            <Text
              style={{
                marginTop: 17,
                fontSize: 27,
                lineHeight: 33,
                fontWeight: '900',
                color: '#FFFFFF',
                letterSpacing: 0.3,
              }}
            >
              HOOPSWITCH
            </Text>

            {/* Tagline */}
            <Text
              style={{
                marginTop: 12,
                fontSize: 13,
                lineHeight: 19,
                fontWeight: '700',
                color: '#FFFFFF',
                textAlign: 'center',
              }}
            >
              Connect. Compete. Get{'\n'}Recruited.
            </Text>

            {/* Get Started */}
            <Pressable
              onPress={() => router.push('/auth/welcome')}
              style={({ pressed }) => ({
                marginTop: 26,
                height: 48,
                paddingHorizontal: 22,
                borderRadius: 10,
                backgroundColor: '#FA4B21',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: '700',
                }}
              >
                Get Started
              </Text>

              <Ionicons
                name="arrow-forward"
                size={17}
                color="white"
                style={{ marginLeft: 8 }}
              />
            </Pressable>
          </View>
        </ImageBackground>
      </View>
    </View>
  );
}