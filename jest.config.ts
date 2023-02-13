import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  clearMocks: true,
  coverageProvider: 'v8',
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  roots: ['<rootDir>/app/tests'],
  testMatch: ['**/tests/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  forceExit: true,
  detectOpenHandles: true,
  modulePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/app/tests/setup.test.ts',
  ],
  setupFilesAfterEnv: ['./app/tests/setup.test.ts'],
  moduleNameMapper: {
    '@controllers/(.*)': ['<rootDir>/app/controller/$1'],
    '@interfaces/(.*)': ['<rootDir>/app/interfaces/$1'],
    '@models/(.*)': ['<rootDir>/app/models/$1'],
    '@database/(.*)': ['<rootDir>/app/database/$1'],
    '@routes/(.*)': ['<rootDir>/app/routes/$1'],
    '@services/(.*)': ['<rootDir>/app/services/$1'],
    '@external-services/(.*)': ['<rootDir>/app/services/external/$1'],
    '@tests/(.*)': ['<rootDir>/app/tests/$1'],
    '@utils/(.*)': ['<rootDir>/app/utils/$1'],
    '@root/(.*)': ['<rootDir>/$1'],
  },
};

export default config;

// https://swizec.com/blog/how-to-configure-jest-with-typescript/
// for reference on how to import fn in your test files
