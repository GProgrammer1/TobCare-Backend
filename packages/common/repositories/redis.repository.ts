import Redis from "ioredis"
import { inject, injectable } from "tsyringe"

@injectable()
export class RedisRepository {
  constructor(@inject("Redis") private redis: Redis) {}

  async get(key: string): Promise<string | null> {
    return await this.redis.get(key)
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<"OK" | null> {
    if (ttlSeconds != null) {
      return await this.redis.setex(key, ttlSeconds, value)
    }
    return await this.redis.set(key, value)
  }

  async del(key: string): Promise<number> {
    return await this.redis.del(key)
  }

  async exists(key: string): Promise<number> {
    return await this.redis.exists(key)
  }
}
