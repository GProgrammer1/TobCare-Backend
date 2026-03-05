import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@tobcare/prisma"

let prisma: PrismaClient | undefined

export const getPrisma = (): PrismaClient => {
  if (!prisma) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set")
    }
    const adapter = new PrismaPg({ connectionString })
    prisma = new PrismaClient({ adapter })
  }
  return prisma
}