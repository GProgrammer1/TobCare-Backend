import { createHmac } from "node:crypto"
import * as argon2 from "argon2"
import { sign } from "jsonwebtoken"

/**
 * Creates an HMAC-SHA256 hash of the input string using the provided secret.
 * @param data - The string to hash
 * @param secret - The secret key for HMAC
 * @returns Hex-encoded HMAC-SHA256 hash
 */
export function hmac256(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("hex")
}

/**
 * Hashes a plaintext string (e.g. password) using Argon2id.
 * @param plain - The string to hash
 * @returns Argon2 hash string
 */
export async function argon2Hash(plain: string): Promise<string> {
  return argon2.hash(plain)
}

/**
 * Verifies a plaintext string against an Argon2 hash.
 * @param hash - The Argon2 hash to verify against
 * @param plain - The plaintext string to verify
 * @returns true if the plaintext matches the hash
 */
export async function argon2Verify(hash: string, plain: string): Promise<boolean> {
  return argon2.verify(hash, plain)
}

/**
 * Generates a JWT access token.
 * @param payload - Claims to embed in the token (e.g. { sub: userId, email, role })
 * @param secret - JWT signing secret
 * @param expiresIn - Token expiry (default: "15m")
 */
export function generateAccessToken(
  payload: Record<string, unknown>,
  secret: string,
  expiresInSeconds = 900, // 15 minutes
): string {
  return sign(payload, secret, { expiresIn: expiresInSeconds })
}

/**
 * Generates a JWT refresh token.
 * @param payload - Claims to embed in the token (e.g. { sub: userId })
 * @param secret - JWT signing secret
 * @param expiresInSeconds - Token expiry in seconds (default: 7 days)
 */
export function generateRefreshToken(
  payload: Record<string, unknown>,
  secret: string,
  expiresInSeconds = 604800, // 7 days
): string {
  return sign(payload, secret, { expiresIn: expiresInSeconds })
}

export function generateOtp(length: number = 6): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join("")
}