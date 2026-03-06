import Redis from "ioredis"
import { env } from "./env"
import { logger } from "./logger"

let redis: Redis | undefined

export const getRedis = (): Redis => {
  if (!redis) {
    const url = env.REDIS_URL
    redis = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 100, 3000)
        logger.warn({ times, delay }, "Redis connection retry")
        return delay
      },
    })
    redis.on("error", (err) => {
      logger.error({ err }, "Redis connection error")
    })
    redis.on("connect", () => {
      logger.info("Redis connected")
    })
  }
  return redis
}
