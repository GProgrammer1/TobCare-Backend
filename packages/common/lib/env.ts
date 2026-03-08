import z from 'zod'
import dotenv from 'dotenv'

const envPath =
  process.env.NODE_ENV === "dev"
    ? ".env.dev"
    : process.env.NODE_ENV === "staging"
      ? ".env.staging"
      : process.env.NODE_ENV === "test"
        ? ".env.test"
        : process.env.NODE_ENV === "production"
          ? ".env.production"
          : ".env"
dotenv.config({ path: envPath })

const envSchema = z.object({
    NODE_ENV: z.string().optional().default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.url({ protocol: /^postgresql$/, error: "DATABASE_URL must be a url with the postgres protocol" }),
    REDIS_URL: z.string().min(1, { message: "REDIS_URL must be set (e.g. redis://localhost:6379)" }),
    CORS_ORIGIN: z.url({ protocol: /^(http|https)$/, error: "CORS_ORIGIN must be a url with the http protocol" }),
    CORS_METHODS: z.string().nonempty(),
    CORS_CREDENTIALS: z.coerce.boolean(),
    OTP_TTL_SECONDS: z.coerce.number().int().positive({ message: "OTP_TTL_SECONDS must be a positive integer" }),
    HMAC_SECRET: z.string().min(1, { message: "HMAC_SECRET must be non-empty" }),
    JWT_SECRET: z.string().min(1, { message: "JWT_SECRET must be non-empty" }),
    JWT_ACCESS_EXPIRY_SECONDS: z.coerce.number().int().positive().default(900), // 15 minutes
    JWT_REFRESH_EXPIRY_SECONDS: z.coerce.number().int().positive().default(604800), // 7 days
    SET_PASSWORD_TTL_SECONDS: z.coerce.number().int().positive().default(86400), // 24 hours
    S3_BUCKET: z.string().optional(),
    S3_REGION: z.string().optional(),
    S3_URL_BASE: z.string().optional(),
    AWS_SES_REGION: z.string().optional(),
    SMTP_FROM: z.string().optional(),
    ADMIN_EMAIL: z.string().optional(),
})

const envConfig = process.env
const result = envSchema.safeParse(envConfig)

if (result.error) {
    throw result.error
}

export const env = result.data