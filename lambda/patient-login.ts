import { commonMiddleware } from './common/middleware';
import { z } from 'zod';
import { Context } from 'aws-lambda';
import { loginPatient } from './services/auth.service';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    otp: z.string().length(6, "OTP must be 6 digits")
});

const logic = async (event: any, context: Context) => {
    const prisma = context.prisma;
    const path = event.path || event.resource;
    const method = event.httpMethod;

    if (method === 'OPTIONS') {
        return { statusCode: 200, body: '' };
    }

    if (path.includes('/patient_login') && method === 'POST') {
        const { loginResult, refreshToken } = await loginPatient(prisma, event.body);

        const cookieHeader = `refreshToken=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`; // 7 days

        return {
            statusCode: 200,
            headers: {
                'Set-Cookie': cookieHeader
            },
            body: loginResult
        };
    }

    return {
        statusCode: 404,
        body: { message: "Not Found" }
    };
};

export const handler = commonMiddleware(logic, {
    '/patient_login': loginSchema
});

