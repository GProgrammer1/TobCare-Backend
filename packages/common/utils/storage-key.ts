import { randomUUID } from "node:crypto"
import { extname } from "node:path"
import { hmac256 } from "./encryption"

/**
 * Generates an opaque, HMAC-hashed storage key for doctor application documents.
 *
 * Path structure: `pending/{hashedEmail}/{hashedDocName}-{uuid}{ext}`
 *
 * - Email folder is HMAC'd so on-disk paths don't reveal PII
 * - Doc field name is HMAC'd so document types aren't guessable
 * - UUID suffix prevents collisions on reapplication
 * - Original file extension is preserved for content-type detection
 *
 * @param email - Doctor's email address
 * @param docFieldName - The form field name (e.g. "nationalIdDoc")
 * @param originalFilename - Original uploaded filename (used for extension)
 * @param secret - HMAC secret key
 * @returns Hashed storage key like `pending/a3f1b2c4d5e6f7a8/c1d2e3f4-9e8f7a6b.pdf`
 */
export function generateStorageKey(
  email: string,
  docFieldName: string,
  originalFilename: string,
  secret: string,
): string {
  const hashedEmail = hmac256(email.toLowerCase(), secret).slice(0, 16)
  const hashedDocName = hmac256(docFieldName, secret).slice(0, 12)
  const uuid = randomUUID().slice(0, 8)
  const ext = extname(originalFilename) || ".bin"

  return `pending/${hashedEmail}/${hashedDocName}-${uuid}${ext}`
}
