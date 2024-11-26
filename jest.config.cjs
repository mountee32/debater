module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.(ts|tsx)$': 'babel-jest'
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '\\.json$': '<rootDir>/src/__mocks__/jsonMock.js',
    '^../utils/env$': '<rootDir>/src/__mocks__/env.ts',
    '^axios$': '<rootDir>/src/__mocks__/axios.ts'
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: [
    '/node_modules/',
    'src/components/DebateGame.test.tsx'
  ]
}
