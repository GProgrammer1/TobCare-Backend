import z from 'zod'
import dotenv from 'dotenv'

const envPath =
  process.env.NODE_ENV === "dev"
    ? ".env.dev"
    : process.env.NODE_ENV === "staging"
      ? ".env.staging"
      : ".env"
dotenv.config({ path: envPath })

const envSchema = z.object({
    DATABASE_URL: z.url({ protocol: /^postgresql$/, error: "DATABASE_URL must be a url with the postgres protocol" }),
    CORS_ORIGIN: z.url({ protocol: /^(http|https)$/, error: "CORS_ORIGIN must be a url with the http protocol" }),
    CORS_METHODS: z.string().nonempty(),
    CORS_CREDENTIALS: z.coerce.boolean()
})

const envConfig = process.env
const result = envSchema.safeParse(envConfig)

if (result.error) {
    throw result.error
}

export const env = result.data