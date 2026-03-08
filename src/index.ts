import "common/lib/env"
import express from "express"
import cors from "cors"
import helmet from "helmet"
import hpp from "hpp"
import morgan from "morgan"
import cookieParser from "cookie-parser"

// Global BigInt serializer — allows JSON.stringify to handle BigInt values
;(BigInt.prototype as any).toJSON = function () {
  return this.toString()
}
import { env } from "common/lib/env"
import { getPrisma } from "common/lib/prisma"
import { getRedis } from "common/lib/redis"
import { logger } from "common/lib/logger"
import { globalErrorHandler } from "common/middlewares/globalErrorHandler"
import { requestLogger } from "common/middlewares/request-logger.middleware"
import { registerContainer } from "patient/container/registry"
import { registerDoctorContainer } from "doctor/container/registry"
import { registerAdminContainer } from "admin/container/registry"
import { createAuthRoutes } from "common/routes/auth.routes"
import { createPatientRouter } from "patient/routes"
import { createDoctorRouter } from "doctor/routes"
import { createAdminRouter } from "admin/routes"

export class AppServer {
  public app: express.Application
  private port: number

  constructor(port = env.PORT) {
    this.app = express()
    this.port = port
  }

  private initContainer() {
    registerContainer()
    registerDoctorContainer()
    registerAdminContainer()
  }

  private initMiddlewares() {
    this.app.use(
      cors({
        origin: env.CORS_ORIGIN,
        credentials: env.CORS_CREDENTIALS,
        methods: env.CORS_METHODS.split(","),
      }),
    )
    this.app.use(helmet())
    this.app.use(hpp())
    env.NODE_ENV === "development" && this.app.use(morgan("dev"))
    this.app.use(express.json({ limit: "10mb" }))
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }))
    this.app.use(cookieParser())
    env.NODE_ENV !== "test" && this.app.use(requestLogger)

    // Serve uploaded files
    this.app.use("/uploads", express.static("uploads"))
  }

  private initRoutes() {
    this.app.get("/health", (_req: express.Request, res: express.Response) => {
      res.status(200).json({ status: "ok" })
    })
    this.app.use("/api/v1/auth", createAuthRoutes())
    this.app.use("/api/v1/patient", createPatientRouter())
    this.app.use("/api/v1/doctor", createDoctorRouter())
    this.app.use("/api/v1/admin", createAdminRouter())
  }

  private async initDatabase() {
    const prisma = getPrisma()
    type LogEvent = { message: string; target: string }
    const onLog = (level: "info" | "warn" | "error") => (e: LogEvent) => {
      if (level === "info") logger.info({ target: e.target, message: e.message }, "Prisma")
      else if (level === "warn") logger.warn({ target: e.target, message: e.message }, "Prisma")
      else logger.error({ target: e.target, message: e.message }, "Prisma")
    }
    ;(prisma as { $on(type: string, cb: (e: LogEvent) => void): void }).$on("info", onLog("info"))
    ;(prisma as { $on(type: string, cb: (e: LogEvent) => void): void }).$on("warn", onLog("warn"))
    ;(prisma as { $on(type: string, cb: (e: LogEvent) => void): void }).$on("error", onLog("error"))
    try {
      await prisma.$connect()
      logger.info("Database connected")
    } catch (err) {
      logger.error({ err }, "Database connection failed")
      throw err
    }
  }

  private async initRedis() {
    const redis = getRedis()
    await redis.ping()
  }

  /** Initialize everything without binding to a port */
  async init(): Promise<express.Application> {
    this.initContainer()
    this.initMiddlewares()
    this.initRoutes()
    this.app.use(globalErrorHandler)
    await this.initDatabase()
    await this.initRedis()
    return this.app
  }

  async start() {
    logger.info({ env: env.NODE_ENV, port: this.port }, "Server starting")
    await this.init()
    this.app.listen(this.port, () => {
      logger.info(`Server is running on port ${this.port}`)
    })
  }
}

// Only auto-start when run directly (not when imported by tests)
if (process.env.NODE_ENV !== "test") {
  const server = new AppServer()
  server.start()
}