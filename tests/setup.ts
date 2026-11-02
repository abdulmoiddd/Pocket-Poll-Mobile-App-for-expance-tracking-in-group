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

  if (request === 'expo-image-picker') {
    return {
      requestCameraPermissionsAsync: async () => ({ status: 'granted' }),
      requestMediaLibraryPermissionsAsync: async () => ({ status: 'granted' }),
      launchCameraAsync: async () => ({
        canceled: false,
        assets: [{ uri: 'file:///mock_receipt.jpg', fileName: 'mock_receipt.jpg' }],
      }),
      launchImageLibraryAsync: async () => ({
        canceled: false,
        assets: [{ uri: 'file:///mock_receipt.jpg', fileName: 'mock_receipt.jpg' }],
      }),
      MediaTypeOptions: { Images: 'Images' },
    };
  }

  if (request === 'firebase/app') {
    return {
      initializeApp: () => ({ name: '[DEFAULT]' }),
      getApps: () => [{ name: '[DEFAULT]' }],
      getApp: () => ({ name: '[DEFAULT]' }),
    };
  }

  if (request === 'firebase/firestore') {
    // In-memory Firestore with offline persistence simulation, queuing & real-time snapshot listeners
    const collections = new Map<string, Map<string, any>>();
    let isNetworkOnline = true;
    let pendingWriteQueue: { colPath: string; docId: string; data: any }[] = [];
    const listeners = new Set<{ path: string; isDoc: boolean; cb: (snap: any) => void }>();

    function getColMap(path: string) {
      if (!collections.has(path)) collections.set(path, new Map());
      return collections.get(path)!;
    }

    function notifyListeners(path: string) {
      for (const listener of listeners) {
        if (listener.isDoc) {
          const parts = listener.path.split('/');
          const docId = parts.pop()!;
          const colPath = parts.join('/');
          if (colPath === path) {
            const data = getColMap(colPath).get(docId);
            listener.cb({
              exists: () => !!data,
              data: () => (data ? { ...data } : undefined),
              id: docId,
              metadata: { fromCache: !isNetworkOnline },
            });
          }
        } else {
          if (listener.path === path) {
            const col = getColMap(path);
            const docs = Array.from(col.entries()).map(([id, data]) => ({
              id,
              data: () => ({ ...data }),
            }));
            listener.cb({
              docs,
              forEach: (fn: any) => docs.forEach(fn),
              metadata: { fromCache: !isNetworkOnline },
            });
          }
        }
      }
    }

    return {
      __esModule: true,
      getFirestore: () => ({ name: 'mock-firestore' }),
      initializeFirestore: () => ({ name: 'mock-firestore' }),
      persistentLocalCache: () => ({}),
      memoryLocalCache: () => ({}),
      collection: (first: any, ...segments: string[]) => {
        let basePath = '';
        if (first && first.path) {
          basePath = first.path;
        }
        const rest = segments.filter(Boolean).join('/');
        const fullPath = basePath ? `${basePath}/${rest}` : rest;
        return { type: 'collection', path: fullPath };
      },
      doc: (first: any, ...segments: string[]) => {
        let basePath = '';
        if (first && first.path) {
          basePath = first.path;
        }
        const rest = segments.filter(Boolean).join('/');
        const fullPath = basePath ? `${basePath}/${rest}` : rest;
        const parts = fullPath.split('/');
        const docId = parts.pop()!;
        const colPath = parts.join('/');
        return { type: 'doc', id: docId, colPath, path: fullPath };
      },
      setDoc: async (docRef: any, data: any) => {
        // Strict Firestore simulation: Reject payloads containing undefined values
        function checkUndefined(val: any, path: string = '') {
          if (val === undefined) {
            throw new Error(
              `Function setDoc() called with invalid data. Unsupported field value: undefined (found in field ${path})`
            );
          }
          if (val && typeof val === 'object' && !Array.isArray(val)) {
            for (const [k, v] of Object.entries(val)) {
              checkUndefined(v, path ? `${path}.${k}` : k);
            }
          }
        }
        checkUndefined(data);

        const col = getColMap(docRef.colPath);
        col.set(docRef.id, { ...data });
        if (!isNetworkOnline) {
          pendingWriteQueue.push({ colPath: docRef.colPath, docId: docRef.id, data });
        }
        notifyListeners(docRef.colPath);
      },
      getDoc: async (docRef: any) => {
        const col = getColMap(docRef.colPath);
        const data = col.get(docRef.id);
        return {
          exists: () => !!data,
          data: () => (data ? { ...data } : undefined),
          id: docRef.id,
          metadata: { fromCache: !isNetworkOnline },
        };
      },
      getDocs: async (queryOrCol: any) => {
        const path = queryOrCol.path || queryOrCol.col?.path || '';
        const col = getColMap(path);
        let items = Array.from(col.entries()).map(([id, data]) => ({
          id,
          data: () => ({ ...data }),
        }));
        if (queryOrCol.orderByField) {
          const field = queryOrCol.orderByField;
          const dir = queryOrCol.orderDir === 'desc' ? -1 : 1;
          items.sort((a, b) => {
            const va = a.data()[field] ?? 0;
            const vb = b.data()[field] ?? 0;
            return va > vb ? dir : va < vb ? -dir : 0;
          });
        }
        return {
          docs: items,
          forEach: (fn: any) => items.forEach(fn),
          metadata: { fromCache: !isNetworkOnline },
        };
      },
      deleteDoc: async (docRef: any) => {
        const col = getColMap(docRef.colPath);
        col.delete(docRef.id);
        notifyListeners(docRef.colPath);
      },
      onSnapshot: (queryOrDoc: any, next: (snap: any) => void) => {
        const isDoc = queryOrDoc.type === 'doc';
        const path = isDoc ? queryOrDoc.path : (queryOrDoc.path || queryOrDoc.col?.path || '');
        const listenerObj = { path, isDoc, cb: next };
        listeners.add(listenerObj);

        // Immediate snapshot dispatch
        if (isDoc) {
          const col = getColMap(queryOrDoc.colPath);
          const data = col.get(queryOrDoc.id);
          next({
            exists: () => !!data,
            data: () => (data ? { ...data } : undefined),
            id: queryOrDoc.id,
            metadata: { fromCache: !isNetworkOnline },
          });
        } else {
          const col = getColMap(path);
          const docs = Array.from(col.entries()).map(([id, data]) => ({
            id,
            data: () => ({ ...data }),
          }));
          next({
            docs,
            forEach: (fn: any) => docs.forEach(fn),
            metadata: { fromCache: !isNetworkOnline },
          });
        }

        return () => {
          listeners.delete(listenerObj);
        };
      },
      query: (col: any, ...constraints: any[]) => {
        let orderByField: string | undefined;
        let orderDir: string = 'asc';
        for (const c of constraints) {
          if (c && c.type === 'orderBy') {
            orderByField = c.field;
            orderDir = c.dir || 'asc';
          }
        }
        return { col, path: col.path, orderByField, orderDir };
      },
      orderBy: (field: string, dir: string = 'asc') => ({ type: 'orderBy', field, dir }),
      enableNetwork: async () => {
        isNetworkOnline = true;
        const toFlush = [...pendingWriteQueue];
        pendingWriteQueue = [];
        for (const w of toFlush) {
          notifyListeners(w.colPath);
        }
      },
      disableNetwork: async () => {
        isNetworkOnline = false;
      },
      waitForPendingWrites: async () => {
        pendingWriteQueue = [];
      },
      terminate: async () => {
        listeners.clear();
      },
    };
  }

  return originalLoad.apply(this, arguments);
};
