/// <reference path="./types/express.d.ts" />
import cors from 'cors'
import helmet from 'helmet'
import express from 'express'
import dotenv from 'dotenv'
import { getPrisma } from './lib/prisma.js'

dotenv.config({
    path: process.env.NODE_ENV === 'development' ? '.env.development' : '.env.production'
})

const app = express()

app.use((req, _res, next) => {
    req.prisma = getPrisma()
    next()
})

app.use(express.json({
    limit: process.env.PAYLOAD_SIZE_LIMIT
}))

app.use(express.urlencoded({ extended: true,
    limit: process.env.PAYLOAD_SIZE_LIMIT
 }))

app.use(cors({
    origin: process.env.ORIGIN,
    credentials: true,
    methods: process.env.CORS_METHODS?.split(',')
}))

app.use(helmet())

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    // TODO: error handling logic
})

const port = process.env.PORT
const host = process.env.HOST!

app.listen(Number(port), host, () => console.log(`Server running on http://${host}:${port}`))

