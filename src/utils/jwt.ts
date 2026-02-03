import jwt from 'jsonwebtoken'

const ACCESS_TOKEN_SECRET: string = process.env.JWT_ACCESS_SECRET! 
const REFRESH_TOKEN_SECRET: string = process.env.JWT_REFRESH_SECRET!

const ACCESS_TOKEN_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY = '7d'

export type TokenPayload = {
  userId: string
  role: string
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY })
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY })
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as TokenPayload
    return decoded
  } catch {
    return null
  }
}
