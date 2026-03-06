import "reflect-metadata"
import { join } from "node:path"
import { container } from "tsyringe"
import { getPrisma } from "../lib/prisma"
import { getRedis } from "../lib/redis"
import { UserRepository } from "../repositories/user.repository"
import { MailService } from "../services/mail/mail.impl.service"
import {
  TemplateRendererConfig,
  TemplateRendererService,
} from "../services/template-renderer.service"
import type { IMailService } from "../services/mail/mail.service"
import type { PrismaClient } from "@tobcare/prisma"
import type Redis from "ioredis"

export function registerContainer() {
  container.registerSingleton<IMailService>("IMailService", MailService)
  container.register<TemplateRendererConfig>("TemplateRendererConfig", {
    useValue: {
      templatesBase: join(process.cwd(), "public", "templates"),
    },
  })
  container.registerSingleton(TemplateRendererService)
  container.register<PrismaClient>("PrismaClient", {
    useValue: getPrisma(),
  })
  container.register<Redis>("Redis", {
    useValue: getRedis(),
  })
  container.registerSingleton("UserRepository", UserRepository)
}

export { container }
