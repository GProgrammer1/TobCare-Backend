/**
 * OTP utilities – generate, store, verify.
 * Storage is in-memory (dev); replace with Redis/DB for production.
 */

const OTP_LENGTH = 6
const OTP_TTL_MS = 10 * 60 * 1000 // 10 minutes

type OtpEntry = {
  otp: string
  expiresAt: number
}

const otpStore = new Map<string, OtpEntry>()

function randomDigits(length: number): string {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString()
  }
  return result
}

export function generateOtp(): string {
  return randomDigits(OTP_LENGTH)
}

export function storeOtp(email: string, otp: string): void {
  otpStore.set(email.toLowerCase(), {
    otp,
    expiresAt: Date.now() + OTP_TTL_MS,
  })
}

export function verifyOtp(email: string, otp: string): boolean {
  const entry = otpStore.get(email.toLowerCase())
  if (!entry) return false
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(email.toLowerCase())
    return false
  }
  return entry.otp === otp
}

export function consumeOtp(email: string, otp: string): boolean {
  if (!verifyOtp(email, otp)) return false
  otpStore.delete(email.toLowerCase())
  return true
}
