import * as LocalAuthentication from 'expo-local-authentication';

export interface BiometricStatus {
  hasHardware: boolean;
  isEnrolled: boolean;
  biometricType: 'FaceID' | 'TouchID' | 'Biometrics' | 'PIN';
}

export const BiometricsService = {
  /**
   * Checks the biometric capabilities of the device
   */
  async checkAvailability(): Promise<BiometricStatus> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      let biometricType: 'FaceID' | 'TouchID' | 'Biometrics' | 'PIN' = 'PIN';
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometricType = 'FaceID';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometricType = 'TouchID';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        biometricType = 'Biometrics';
      }

      return {
        hasHardware,
        isEnrolled,
        biometricType,
      };
    } catch {
      return {
        hasHardware: false,
        isEnrolled: false,
        biometricType: 'PIN',
      };
    }
  },

  /**
   * Prompt biometric authentication with customized title and fallback to device passcode
   */
  async authenticate(promptMessage: string = 'Unlock PocketPool to access financial data'): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const availability = await this.checkAvailability();
      if (!availability.hasHardware || !availability.isEnrolled) {
        // Fall back to app PIN
        return { success: false, error: 'NO_BIOMETRICS_AVAILABLE' };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Use PIN',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        return { success: true };
      } else {
        return { success: false, error: result.error || 'AUTHENTICATION_FAILED' };
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'BIOMETRIC_ERROR' };
    }
  },

  /**
   * Validates custom 4-digit in-app PIN
   */
  validatePin(enteredPin: string, correctPin: string): boolean {
    return enteredPin.trim() === correctPin.trim();
  },
};
