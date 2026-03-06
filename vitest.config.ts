import { defineConfig } from "vitest/config"
import path from "node:path"

const root = path.resolve(__dirname)

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/packages/*/tests/**/*.test.ts"],
    globals: true,
    testTimeout: 20000,
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    setupFiles: [path.join(root, "packages/common/tests/setup.ts")],
    globalSetup: [path.join(root, "packages/common/tests/global-setup.ts")],
  },
  resolve: {
    alias: [
      { find: /^common\/(.*)$/, replacement: path.resolve(root, "packages/common") + "/$1" },
      { find: /^patient\/(.*)$/, replacement: path.resolve(root, "packages/patient") + "/$1" },
      { find: "@tobcare/prisma", replacement: path.resolve(root, "generated/prisma/client.ts") },
    ],
  },
})
