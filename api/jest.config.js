module.exports = {
  preset: 'jest-preset-loopback',
  modulePathIgnorePatterns: [
    '~/.cache',
  ],
  setupTestFrameworkScriptFile: '<rootDir>/test/setUpTestEnvironment',
};
