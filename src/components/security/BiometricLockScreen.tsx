import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';
import { Logo } from '../common/Logo';
import { BiometricsService } from '../../services/biometrics';
import { Fingerprint, Delete, ShieldAlert } from 'lucide-react-native';

interface BiometricLockScreenProps {
  correctPin: string;
  onUnlocked: () => void;
  groupName: string;
}

export const BiometricLockScreen: React.FC<BiometricLockScreenProps> = ({
  correctPin,
  onUnlocked,
  groupName,
}) => {
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [biometricType, setBiometricType] = useState<string>('Biometrics');

  useEffect(() => {
    async function initBiometrics() {
      const avail = await BiometricsService.checkAvailability();
      setBiometricType(avail.biometricType);
      if (avail.hasHardware && avail.isEnrolled) {
        handleBiometricPrompt();
      }
    }
    initBiometrics();
  }, []);

  const handleBiometricPrompt = async () => {
    const res = await BiometricsService.authenticate(
      `Unlock ${groupName} to view pool finances`
    );
    if (res.success) {
      onUnlocked();
    }
  };

  const handleNumberPress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setErrorMessage('');

      if (newPin.length === 4) {
        if (BiometricsService.validatePin(newPin, correctPin)) {
          onUnlocked();
        } else {
          Vibration.vibrate(200);
          setErrorMessage('Incorrect PIN. Please try again.');
          setTimeout(() => setPin(''), 500);
        }
      }
    }
  };

  const handleDeletePress = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setErrorMessage('');
    }
  };

  return (
    <LinearGradient
      colors={theme.gradients.primary}
      style={styles.container}
      accessibilityRole="alert"
      accessibilityLabel="Security Lock Screen. Enter your PIN or use biometrics to unlock PocketPool."
    >
      <View style={styles.topSection}>
        <View style={styles.logoWrapper}>
          <Logo size={80} />
        </View>
        <Text style={styles.appName}>PocketPool</Text>
        <Text style={styles.groupSubtitle}>{groupName}</Text>
        <Text style={styles.prompt}>
          {errorMessage || 'Enter 4-Digit Security PIN'}
        </Text>

        {/* PIN Dots */}
        <View style={styles.dotsRow}>
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  isFilled && styles.dotFilled,
                  errorMessage ? styles.dotError : null,
                ]}
              />
            );
          })}
        </View>
      </View>

      {/* Number Pad */}
      <View style={styles.keypad}>
        {[
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
        ].map((row, rIdx) => (
          <View key={rIdx} style={styles.keypadRow}>
            {row.map((num) => (
              <TouchableOpacity
                key={num}
                style={styles.key}
                onPress={() => handleNumberPress(num)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={num}
              >
                <Text style={styles.keyText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <View style={styles.keypadRow}>
          <TouchableOpacity
            style={styles.key}
            onPress={handleBiometricPrompt}
            accessibilityRole="button"
            accessibilityLabel={`Use ${biometricType}`}
          >
            <Fingerprint size={28} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.key}
            onPress={() => handleNumberPress('0')}
            accessibilityRole="button"
            accessibilityLabel="0"
          >
            <Text style={styles.keyText}>0</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.key}
            onPress={handleDeletePress}
            accessibilityRole="button"
            accessibilityLabel="Delete digit"
          >
            <Delete size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: 50,
    paddingHorizontal: 30,
  },
  topSection: {
    alignItems: 'center',
  },
  logoWrapper: {
    marginBottom: 16,
    padding: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 30,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  groupSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
    marginTop: 4,
  },
  prompt: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 6,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#FFFFFF',
  },
  dotError: {
    borderColor: '#FCA5A5',
    backgroundColor: '#EF4444',
  },
  keypad: {
    gap: 16,
    maxWidth: 320,
    alignSelf: 'center',
    width: '100%',
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
