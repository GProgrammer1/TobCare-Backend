import { z } from 'zod';
export const sendOtpSchema = z.object({
    email: z.email('Invalid email address'),
});
const genderEnum = z.enum(['M', 'F']);
const bloodTypeEnum = z.enum(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']);
export const registerPatientSchema = z
    .object({
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must not exceed 50 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    firstName: z
        .string()
        .min(2, 'First name must be at least 2 characters')
        .max(50, 'First name must not exceed 50 characters'),
    lastName: z
        .string()
        .min(2, 'Last name must be at least 2 characters')
        .max(50, 'Last name must not exceed 50 characters'),
    email: z.email('Invalid email address').max(30),
    phoneNumber: z
        .string()
        .min(1, 'Phone number is required')
        .max(15, 'Phone number must not exceed 15 digits')
        .regex(/^[0-9\s]+$/, 'Phone number must contain digits only'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
    gender: genderEnum,
    bloodType: bloodTypeEnum,
    dateOfBirth: z.string().refine((d) => new Date(d) < new Date(), 'Date of birth must be in the past'),
    countryId: z.number().int().positive('Please select your country'),
    address: z.string().min(1, 'Address is required').max(50),
    terms: z.boolean().refine((v) => v === true, 'You must accept the terms'),
    otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^[0-9]+$/, 'OTP must contain only digits'),
})
    .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});
