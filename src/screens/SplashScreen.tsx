import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';
import { Logo } from '../components/common/Logo';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const textFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.delay(800),
    ]).start(() => {
      onFinish();
    });
  }, [fadeAnim, scaleAnim, textFade, onFinish]);

  return (
    <LinearGradient
      colors={theme.gradients.primary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
      accessibilityRole="image"
      accessibilityLabel="PocketPool Splash Screen"
    >
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Logo size={140} />
      </Animated.View>

      <Animated.View style={[styles.textContainer, { opacity: textFade }]}>
        <Text style={styles.brandTitle}>PocketPool</Text>
        <Text style={styles.tagline}>Group Budgeting &amp; Smart Pooling</Text>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 48,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 12,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 28,
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 6,
    letterSpacing: 0.3,
  },
});
