import type { Request, Response } from 'express'
import { sendOtpSchema } from '../validation/auth.ts'
import { sendOtpToEmail } from '../services/auth.service.ts'
import type { ApiResponse } from '../types/api.ts'

export async function sendOtp(req: Request, res: Response): Promise<void> {
  const data = sendOtpSchema.parse(req.body)

  await sendOtpToEmail(data.email)

  res.status(200).json({
    success: true,
    data: { message: 'OTP sent to your email' },
  } satisfies ApiResponse<{ message: string }>)
}
