import type { Config } from 'jest';

const config: Config = {
  // Use Node environment – no DOM needed for service-layer tests
  testEnvironment: 'node',

  // ts-jest compiles TypeScript; override tsconfig to use CommonJS
  // (Next.js uses "module: esnext" which jest can't run directly)
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          moduleResolution: 'node',
          esModuleInterop: true,
        },
      },
    ],
  },

  // Resolve the @/* path alias defined in tsconfig.json
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },

  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
};

export default config;
