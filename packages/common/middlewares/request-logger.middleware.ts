import pinoHttp from "pino-http"
import { logger } from "../lib/logger"
import { env } from "../lib/env"

export const requestLogger = pinoHttp({
  logger,
  autoLogging: env.NODE_ENV !== "test",
  customSuccessMessage: (req, res) =>
    `${req.method} ${req.url} ${res.statusCode}`,
  customErrorMessage: (req, res, err) =>
    `${req.method} ${req.url} ${res.statusCode} - ${err?.message ?? "error"}`,
})
