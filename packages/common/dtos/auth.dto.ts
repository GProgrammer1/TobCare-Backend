import { UserRole } from '@tobcare/prisma'
import z from 'zod'

// User signup , for both patient and doctor
export const userSignupSchema = z.object({
    firstName: z.string().min(1).max(255),
    lastName: z.string().min(1).max(255),
    email: z.email().max(255),
    password: z.string()
    .regex(/[A-Z]/, { error: "Password should contain at least an uppercase letter"})
    .regex(/[a-z]/, { error: "Password should contain at least a lowercase letter"})
    .regex(/[0-9]/, { error: "Password should contain at least one digit"})
    .regex(/[^A-Za-z0-9]/, { error: "Password should contain at least one special character"}) 
    .min(8, { error: "Password minimum length is 8"}),
    role: z.enum(UserRole),
    phoneNumber: z.coerce.bigint()
})

export const encryptedUserSignupSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().min(1),
    passwordHash: z.string().min(1),
    role: z.enum(UserRole),
    phoneNumber: z.string().min(1)
})

export const otpRequestSchema = z.object({
    email: z.email().max(255)
})

export const otpVerificationSchema = z.object({
    email: z.email().max(255),
    otp: z.string().length(6).regex(/^\d+$/, "OTP must be 6 digits")
})

export type OtpRequestDto = z.infer<typeof otpRequestSchema>
export type OtpVerificationDto = z.infer<typeof otpVerificationSchema>

export type UserSignupDto = z.infer<typeof userSignupSchema>
export type EncryptedUserSignupDto = z.infer<typeof encryptedUserSignupSchema>