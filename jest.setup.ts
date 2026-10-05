import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock';

jest.mock('react-native-safe-area-context', () => mockSafeAreaContext);

jest.mock('react-native-keychain', () => {
  const store = new Map<string, string>();
  return {
    ACCESSIBLE: {
      WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'AccessibleWhenUnlockedThisDeviceOnly',
    },
    STORAGE_TYPE: { AES_GCM_NO_AUTH: 'KeystoreAESGCM_NoAuth' },
    SECURITY_LEVEL: { SECURE_SOFTWARE: 0 },
    setGenericPassword: jest.fn(
      async (_u: string, password: string, opts: { service: string }) => {
        store.set(opts.service, password);
        return { service: opts.service, storage: 'mock' };
      },
    ),
    getGenericPassword: jest.fn(async (opts: { service: string }) =>
      store.has(opts.service)
        ? {
            username: 'azari',
            password: store.get(opts.service),
            service: opts.service,
          }
        : false,
    ),
    resetGenericPassword: jest.fn(async (opts: { service: string }) =>
      store.delete(opts.service),
    ),
  };
});

jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => {
    const data = new Map<string, string>();
    return {
      getString: (key: string) => data.get(key),
      set: (key: string, value: string) => data.set(key, value),
      remove: (key: string) => data.delete(key),
      clearAll: () => data.clear(),
    };
  }),
}));

// Count-ups tick on requestAnimationFrame outside React's act(); tests assert
// on final values, so render the target straight away.
jest.mock('./src/ui/motion/useCountUp', () => ({
  useCountUp: (target: number) => target,
}));
