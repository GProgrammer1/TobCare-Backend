module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test', '<rootDir>/lambda'],
  testMatch: ['**/*.test.ts', '**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  setupFilesAfterEnv: ['aws-cdk-lib/testhelpers/jest-autoclean'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'lambda/services/**/*.ts',
    '!lambda/services/**/*.test.ts',
    '!lambda/**/__tests__/**',
  ],
};
