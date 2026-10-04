module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    'no-console': ['error', { allow: ['warn', 'error'] }],
    '@typescript-eslint/no-explicit-any': 'error',
    'react-native/no-inline-styles': 'error',
    // `void promise` marks a deliberately unawaited call in event handlers.
    'no-void': 'off',
  },
  ignorePatterns: ['coverage/', 'node_modules/'],
};
