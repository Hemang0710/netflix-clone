import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testMatch: ['**/test/**/*.test.js', '**/__tests__/**/*.test.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // jose is ESM-only and Jest doesn't transform node_modules
    '^jose$': '<rootDir>/__mocks__/jose.js',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.d.ts',
    '!src/**/index.js',
  ],
  testPathIgnorePatterns: [
    '__tests__/integration/',
    '__tests__/components/ConceptMasteryPassport.test.js',
  ],
}

export default createJestConfig(customJestConfig)
