// Preload setup for automated unit test execution in Node environment
(globalThis as any).__DEV__ = true;

import Module from 'module';

const originalLoad = (Module as any)._load;
const memoryStore = new Map<string, string>();

(Module as any)._load = function (request: string, parent: any, isMain: boolean) {
  if (request === 'react-native') {
    return {
      Platform: { OS: 'ios', select: (obj: any) => obj.ios || obj.default },
      StyleSheet: { create: (styles: any) => styles },
      Dimensions: { get: () => ({ width: 375, height: 812 }) },
      Vibration: { vibrate: () => {} },
      Animated: {
        Value: class {
          constructor(public v: number) {}
        },
        timing: () => ({ start: (cb?: () => void) => cb && cb() }),
        spring: () => ({ start: (cb?: () => void) => cb && cb() }),
        sequence: (arr: any[]) => ({ start: (cb?: () => void) => cb && cb() }),
        parallel: (arr: any[]) => ({ start: (cb?: () => void) => cb && cb() }),
        delay: () => ({ start: (cb?: () => void) => cb && cb() }),
      },
    };
  }

  if (request === '@react-native-async-storage/async-storage') {
    const mockStorage = {
      getItem: async (k: string) => memoryStore.get(k) ?? null,
      setItem: async (k: string, v: string) => {
        memoryStore.set(k, v);
      },
      removeItem: async (k: string) => {
        memoryStore.delete(k);
      },
      clear: async () => {
        memoryStore.clear();
      },
    };
    return {
      __esModule: true,
      default: mockStorage,
      ...mockStorage,
    };
  }

  if (request === 'expo-print') {
    return {
      printToFileAsync: async ({ html }: { html: string }) => ({
        uri: 'file:///data/mock_invoice.pdf',
      }),
    };
  }

  if (request === 'expo-sharing') {
    return {
      isAvailableAsync: async () => true,
      shareAsync: async () => {},
    };
  }

  if (request === 'expo-file-system') {
    return {
      documentDirectory: 'file:///mock_docs/',
      writeAsStringAsync: async () => {},
      EncodingType: { UTF8: 'utf8' },
    };
  }

  if (request === 'expo-local-authentication') {
    return {
      hasHardwareAsync: async () => true,
      isEnrolledAsync: async () => true,
      supportedAuthenticationTypesAsync: async () => [1, 2],
      authenticateAsync: async () => ({ success: true }),
      AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2, IRIS: 3 },
    };
  }

  return originalLoad.apply(this, arguments);
};
