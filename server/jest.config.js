/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    "**/src/__tests__/**/*.test.[jt]s?(x)"
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/src/__tests__/utils/testUtils.ts"
  ],
  collectCoverage: true,
  coverageReporters: ['text', 'lcov'],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/__tests__/utils/testUtils.ts"
  ],
  coverageDirectory: 'coverage'
};
