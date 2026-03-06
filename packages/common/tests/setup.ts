/**
 * Per-worker setup — runs before each test file.
 * Boots the AppServer (container + middleware + routes + DB + Redis)
 * and exposes the Express app + cleanup helpers.
 *
 * Mock must be here (not in test file) because createAuthRoutes() resolves
 * AuthController at init time, loading AuthService/encryption before tests run.
 */
import { vi } from "vitest"
vi.mock("common/utils/encryption", async (importOriginal) => {
  const actual = await importOriginal<typeof import("common/utils/encryption")>()
  return {
    ...actual,
    generateOtp: vi.fn(() => "123456"),
  }
})

import "reflect-metadata"
import type { Application } from "express"
import { AppServer } from "../../../src/index"
import { getPrisma } from "common/lib/prisma"
import { getRedis } from "common/lib/redis"

let app: Application

const TABLE_NAMES = [
  "emergency_contacts",
  "medications",
  "allergies",
  "diseases",
  "patients",
  "users",
]

beforeAll(async () => {
  const server = new AppServer()
  app = await server.init()
})

afterEach(async () => {
  // Truncate all tables between tests
  const prisma = getPrisma()
  for (const table of TABLE_NAMES) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`)
  }

  // Flush Redis test data
  const redis = getRedis()
  await redis.flushdb()
})

afterAll(async () => {
  const prisma = getPrisma()
  await prisma.$disconnect()

  const redis = getRedis()
  await redis.quit()
})

export function getApp(): Application {
  return app
}
