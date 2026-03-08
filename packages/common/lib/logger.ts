import { mkdirSync } from "node:fs"
import { dirname } from "node:path"
import pino from "pino"
import { env } from "./env"

const isProd = env.NODE_ENV === "production"
const isTest = env.NODE_ENV === "test"

function createLogger() {
  if (isTest) {
    return pino({ level: "silent" })
  }

  if (isProd) {
    const logPath = env.LOG_FILE_PATH ?? "logs/app.log"
    mkdirSync(dirname(logPath), { recursive: true })
    return pino(
      { level: "info" },
      pino.destination({ dest: logPath, mkdir: true, append: true }),
    )
  }

  return pino({
    level: "debug",
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        ignore: "pid,hostname",
        translateTime: "SYS:standard",
      },
    },
  })
}

export const logger = createLogger()
