import { NextFunction, Request, Response } from "express"
import { AppError } from "../errors/errors"
import { logger } from "common/lib/logger"
import { ZodError } from "zod"

export async function globalErrorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
    logger.error(err.message)
    if (err instanceof ZodError) {
        logger.error("Error is a ZodError")
        return res.status(400).json({
            message: "Validation error",
            timestamp: new Date().toISOString(),
            details: err.issues.map((issue) => ({
                path: issue.path.join("."),
                message: issue.message
            })),
        })
    }

    if (err instanceof AppError) {
        logger.error("Error is a AppError")
        return res.status(err.statusCode).json({
            message: err.message,
            timestamp: err.timestamp,
            details: err.details
        })
    }
    logger.error("Error is not a ZodError or AppError")
    return res.status(500).json({
        message: "Internal server error",
        timestamp: new Date().toISOString(),
        details: err.message
    })
}