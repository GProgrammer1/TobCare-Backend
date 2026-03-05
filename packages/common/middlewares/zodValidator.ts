import { NextFunction, Request, Response } from "express"
import type { ZodType } from "zod"

export function zodValidator(schema: ZodType) {
    return async (req: Request, _res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync(req.body)
            next()
        } catch (error) {
            next(error)
        }
    }
}