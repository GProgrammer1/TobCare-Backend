import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@tobcare/prisma"
import { env } from "./env"

let prisma: PrismaClient | undefined

export const getPrisma = (): PrismaClient => {
  if (!prisma) {
    const connectionString = env.DATABASE_URL
    const adapter = new PrismaPg({ connectionString })
    prisma = new PrismaClient({
      adapter,
      log: [
        { emit: "event", level: "info" },
        { emit: "event", level: "warn" },
        { emit: "event", level: "error" },
      ],
    })
  }
  return prisma
}