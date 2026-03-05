import "common/lib/env"
import express from "express"
import cors from "cors"
import helmet from "helmet"
import hpp from "hpp"
import morgan from "morgan"
import { env } from "common/lib/env"
import { getPrisma } from "common/lib/prisma"
import { logger } from "common/lib/logger"
import { globalErrorHandler } from "common/middlewares/globalErrorHandler"

export class AppServer {
  private app: express.Application
  private port: number

  constructor(port = 3000) {
    this.app = express()
    this.port = port
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
    process.env.NODE_ENV === "development" && this.app.use(morgan("dev"))
    this.app.use(express.json({ limit: "10mb" }))
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }))
    this.app.use(globalErrorHandler)
  }

  private async initDatabase() {
    const prisma = getPrisma()
    await prisma.$connect()
    logger.info("Database connected")
  }

  // initializing all plugins
  async start() {
    this.initMiddlewares()
    await this.initDatabase()
    this.app.listen(this.port, () => {
      logger.info(`Server is running on port ${this.port}`)
    })
  }


}

const server = new AppServer(3000)
server.start()