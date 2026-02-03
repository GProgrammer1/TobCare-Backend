/// <reference path="./types/express.d.ts" />
import './config.ts'
import dotenv from 'dotenv'
import cors from 'cors'
import helmet from 'helmet'
import express from 'express'
import { getPrisma } from './lib/prisma.ts'
import countriesRoutes from './routes/countries.routes.ts'
import authRoutes from './routes/auth.routes.ts'
import patientRoutes from './routes/patient/index.ts'
import devRoutes from './routes/dev.routes.ts'



const app = express()

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
    // TODO: error handling logic
})

const port = process.env.PORT
const host = process.env.HOST!

app.listen(Number(port), host, () => console.log(`Server running on http://${host}:${port}`))

