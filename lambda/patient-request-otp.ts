import { commonMiddleware } from './common/middleware';
import { z } from 'zod';
import { Context } from 'aws-lambda';
import { requestLoginOtp } from './services/otp.service';

const requestOtpSchema = z.object({
    email: z.string().email()
});

const logic = async (event: any, context: Context) => {
    const prisma = context.prisma;
    const path = event.path || event.resource;
    const method = event.httpMethod;

    if (method === 'OPTIONS') {
        return { statusCode: 200, body: '' };
    }

    if (path.includes('/patient_request_otp') && method === 'POST') {
        const result = await requestLoginOtp(prisma, event.body);
        return {
            statusCode: 200,
            body: result
        };
    }

    return {
        statusCode: 404,
        body: { message: "Not Found" }
    };
};

export const handler = commonMiddleware(logic, {
    '/patient_request_otp': requestOtpSchema
});

