import { z } from 'zod';
import { Prisma } from "../generated/prisma/client.js";
import { registerPatientSchema } from "../validation/auth.js";
import { registerPatient } from "../services/auth.service.js";
const REFRESH_TOKEN_COOKIE = 'refreshToken';
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
export async function registerPatientController(req, res) {
    const parseResult = registerPatientSchema.safeParse(req.body);
    if (!parseResult.success) {
        const { fieldErrors } = z.flattenError(parseResult.error);
        const firstMessage = Object.values(fieldErrors)[0]?.[0] ?? null;
        res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: firstMessage ?? 'Invalid request',
                fields: fieldErrors,
            },
        });
        return;
    }
    try {
        const result = await registerPatient(req.prisma, parseResult.data);
        res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: REFRESH_TOKEN_MAX_AGE_MS,
            path: '/',
        });
        res.status(201).json({
            success: true,
            data: result.authResponse,
        });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Registration failed';
        if (message === 'INVALID_OTP') {
            res.status(400).json({
                success: false,
                error: { code: 'INVALID_OTP', message: 'Invalid or expired verification code' },
            });
            return;
        }
        if (message === 'PATIENT_ROLE_NOT_FOUND' || message === 'COUNTRY_NOT_FOUND' || message === 'INVALID_BLOOD_TYPE') {
            res.status(500).json({
                success: false,
                error: { code: 'SERVER_ERROR', message: 'Server configuration error' },
            });
            return;
        }
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
            res.status(409).json({
                success: false,
                error: { code: 'CONFLICT', message: 'Username, email, or phone number already in use' },
            });
            return;
        }
        console.error('[registerPatient]', err);
        res.status(500).json({
            success: false,
            error: { code: 'REGISTRATION_FAILED', message: 'Registration failed. Please try again.' },
        });
    }
}
