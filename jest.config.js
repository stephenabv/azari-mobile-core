module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.ts'],
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.{ts,tsx}'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-native-documents|@react-navigation|@noble/hashes|react-native-.*)/)',
  ],
};
