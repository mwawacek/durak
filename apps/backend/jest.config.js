/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js'],
  moduleNameMapper: {
    // Resolve @durak/shared to the built dist (same as production runtime).
    '^@durak/shared$': '<rootDir>/../../packages/shared/dist/index.js',
  },
  clearMocks: true,
};
