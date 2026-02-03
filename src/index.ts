/// <reference path="./types/express.d.ts" />
import './config.ts'
import dotenv from 'dotenv'
import cors from 'cors'
import helmet from 'helmet'
import express from 'express'
import { getPrisma } from './lib/prisma.ts'
import { Prisma } from './generated/prisma/client.ts'
import countriesRoutes from './routes/countries.routes.ts'
import authRoutes from './routes/auth.routes.ts'
import patientRoutes from './routes/patient/index.ts'
import devRoutes from './routes/dev.routes.ts'
import morgan from 'morgan'
import cron from 'node-cron'
import { cleanupExpiredTokens } from './jobs/cleanup.ts'
import { ZodError } from 'zod'
import { AppError } from './utils/errors.ts'
import type { ApiResponse } from './types/api.ts'


const app = express()
app.use(morgan('dev'))
app.use((req, _res, next) => {
    req.prisma = getPrisma()
    next()
})

app.use(express.json({
    limit: process.env.PAYLOAD_SIZE_LIMIT
}))

app.use(express.urlencoded({
    extended: true,
    limit: process.env.PAYLOAD_SIZE_LIMIT
}))

app.use(cors({
    origin: process.env.ORIGIN,
    credentials: true,
    methods: process.env.CORS_METHODS?.split(',')
}))

app.use(helmet())

app.use('/api/v1/countries', countriesRoutes)
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/patient', patientRoutes)

if (process.env.NODE_ENV === 'development') {
    app.use('/api/v1/dev', devRoutes)
}

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
                fields: err.fields
            }
        } satisfies ApiResponse<never>)
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'CONFLICT',
                    message: 'This record already exists.'
                }
            } satisfies ApiResponse<never>)
        }
    }

    if (err instanceof ZodError) {
        const fields: Record<string, string[]> = {}
        err.issues.forEach((issue) => {
            const path = issue.path.join('.')
            if (!fields[path]) fields[path] = []
            fields[path].push(issue.message)
        })

        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: err.issues[0]?.message || 'Validation failed',
                fields
            }
        } satisfies ApiResponse<never>)
    }

    console.error('[Unhandled Error]', err)

    return res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: process.env.NODE_ENV === 'production'
                ? 'An unexpected error occurred'
                : err.message
        }
    } satisfies ApiResponse<never>)
})

const port = process.env.PORT
const host = process.env.HOST!

app.listen(Number(port), host, () => {
    console.log(`Server running on http://${host}:${port}`)

    // Schedule cleanup job
    cron.schedule('0 0 * * *', async () => {
        console.log('[Cron] Running daily cleanup of expired tokens...')
        await cleanupExpiredTokens(getPrisma())
    })
})

