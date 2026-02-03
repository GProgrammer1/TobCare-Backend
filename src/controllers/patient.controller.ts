import type { Request, Response } from 'express'
import { registerPatientSchema, loginSchema, verifyLoginOtpSchema, forgotPasswordSchema, resetPasswordSchema } from '../validation/auth.ts'
import { registerPatient, login, verifyLoginOtp, requestPasswordReset, resetPassword } from '../services/auth.service.ts'
import type { ApiResponse } from '../types/api.ts'

const REFRESH_TOKEN_COOKIE = 'refreshToken'
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export async function registerPatientController(req: Request, res: Response): Promise<void> {
  const data = registerPatientSchema.parse(req.body)
  const result = await registerPatient(req.prisma, data)

  res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    path: '/',
  })

  res.status(201).json({
    success: true,
    data: result.authResponse,
  } satisfies ApiResponse<{ userId: string; role: string; accessToken: string }>)
}

export async function loginPatientController(req: Request, res: Response): Promise<void> {
  const data = loginSchema.parse(req.body)
  const result = await login(req.prisma, data)

  res.status(200).json({
    success: true,
    data: result,
  } satisfies ApiResponse<{ message: string }>)
}

export async function verifyPatientLoginOtpController(req: Request, res: Response): Promise<void> {
  const data = verifyLoginOtpSchema.parse(req.body)
  const result = await verifyLoginOtp(req.prisma, data)

  res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    path: '/',
  })

  res.status(200).json({
    success: true,
    data: result.authResponse,
  } satisfies ApiResponse<{ userId: string; role: string; accessToken: string }>)
}

export async function forgotPasswordController(req: Request, res: Response): Promise<void> {
  const data = forgotPasswordSchema.parse(req.body)

  // Uniform response: We always return success to the client
  try {
    await requestPasswordReset(req.prisma, data.email)
  } catch (err) {
    console.error('[forgotPasswordController]', err)
  }

  res.status(200).json({
    success: true,
    data: { message: 'If an account exists for this email, you will receive reset instructions shortly.' },
  } satisfies ApiResponse<{ message: string }>)
}

export async function resetPasswordController(req: Request, res: Response): Promise<void> {
  const data = resetPasswordSchema.parse(req.body)
  await resetPassword(req.prisma, data)

  res.status(200).json({
    success: true,
    data: { message: 'Password has been reset successfully.' },
  } satisfies ApiResponse<{ message: string }>)
}
