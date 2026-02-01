import type { PrismaClient } from '../generated/prisma/client.ts'

declare global {
  namespace Express {
    interface Request {
      prisma: PrismaClient
    }
  }
}
