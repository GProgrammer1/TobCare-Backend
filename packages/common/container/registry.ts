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
import type { IFileStorageService } from "../services/io/file-storage.service"
import {
  LocalFileStorageService,
  FILE_STORAGE_BASE_PATH,
  FILE_STORAGE_URL_BASE,
} from "../services/io/file-storage.impl.service"
import {
  S3FileStorageService,
  S3_BUCKET,
  S3_REGION,
  S3_URL_BASE,
} from "../services/io/file-storage-s3.impl.service"
import type { PrismaClient } from "@tobcare/prisma"
import type Redis from "ioredis"

export function registerContainer() {
  container.registerSingleton<IMailService>("IMailService", MailService)

  // File storage — production uses S3, everything else uses local
  if (process.env.NODE_ENV === "production") {
    container.register(S3_BUCKET, { useValue: process.env.S3_BUCKET! })
    container.register(S3_REGION, { useValue: process.env.S3_REGION! })
    container.register(S3_URL_BASE, {
      useValue: process.env.S3_URL_BASE ??
        `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com`,
    })
    container.registerSingleton<IFileStorageService>("IFileStorageService", S3FileStorageService)
  } else {
    container.register(FILE_STORAGE_BASE_PATH, { useValue: "uploads" })
    container.register(FILE_STORAGE_URL_BASE, { useValue: "/uploads" })
    container.registerSingleton<IFileStorageService>("IFileStorageService", LocalFileStorageService)
  }

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
