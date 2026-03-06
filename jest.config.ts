import type { Config } from "jest"

const config: Config = {
  testEnvironment: "node",
  testMatch: ["**/packages/*/tests/**/*.test.ts"],
  testTimeout: 20000,
  maxWorkers: 1,
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^common/(.*)$": "<rootDir>/packages/common/$1",
    "^patient/(.*)$": "<rootDir>/packages/patient/$1",
    "^@tobcare/prisma$": "<rootDir>/generated/prisma/client.ts",
  },
  transform: {
    "^.+\\.ts$": [
      "@swc/jest",
      {
        jsc: {
          parser: {
            syntax: "typescript",
            decorators: true,
          },
          transform: {
            decoratorMetadata: true,
          },
          target: "es2022",
        },
        module: {
          type: "es6",
        },
      },
    ],
    "^.+\\.m?js$": [
      "@swc/jest",
      {
        jsc: {
          parser: {
            syntax: "ecmascript",
          },
          target: "es2022",
        },
        module: {
          type: "es6",
        },
      },
    ],
  },
  transformIgnorePatterns: [
    "node_modules/(?!(@prisma|ioredis)/)",
  ],
  globalSetup: "<rootDir>/packages/common/tests/global-setup.ts",
  globalTeardown: "<rootDir>/packages/common/tests/global-teardown.ts",
  setupFilesAfterEnv: ["<rootDir>/packages/common/tests/setup.ts"],
}

export default config
