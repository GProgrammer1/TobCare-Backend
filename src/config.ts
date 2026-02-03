import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const envFile = process.env.NODE_ENV === 'development' ? '.env.development' : '.env.production'
const envPath = path.resolve(process.cwd(), envFile)

dotenv.config({ path: envPath })

console.log(`[Config] Loaded environment variables from ${envFile}`)
