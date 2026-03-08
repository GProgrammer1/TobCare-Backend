import { NextFunction, Request, Response } from "express"
import { AppError } from "../errors/errors"
import { logger } from "common/lib/logger"
import { ZodError } from "zod"

export async function globalErrorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
    logger.error({ err, stack: err.stack, name: err.name }, err.message)
    if (err instanceof ZodError) {
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
        return res.status(err.statusCode).json({
            message: err.message,
            timestamp: err.timestamp,
            details: err.details
        })
    }
    return res.status(500).json({
        message: "Internal server error",
        timestamp: new Date().toISOString(),
        details: err.message
    })
}