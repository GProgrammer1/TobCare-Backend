import { z } from 'zod';
import { sendOtpSchema } from "../validation/auth.js";
import { sendOtpToEmail } from "../services/auth.service.js";
export async function sendOtp(req, res) {
    const parseResult = sendOtpSchema.safeParse(req.body);
    if (!parseResult.success) {
        const { fieldErrors } = z.flattenError(parseResult.error);
        const emailErrors = fieldErrors.email;
        res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: emailErrors?.[0] ?? 'Invalid request',
                fields: fieldErrors,
            },
        });
        return;
    }
    const { email } = parseResult.data;
    try {
        await sendOtpToEmail(email);
        res.status(200).json({
            success: true,
            data: { message: 'OTP sent to your email' },
        });
    }
    catch (err) {
        console.error('[sendOtp]', err);
        res.status(500).json({
            success: false,
            error: {
                code: 'SEND_FAILED',
                message: 'Failed to send OTP. Please try again.',
            },
        });
    }
}
