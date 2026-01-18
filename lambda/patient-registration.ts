import { commonMiddleware } from './common/middleware';
import { z } from 'zod';
import { Context } from 'aws-lambda';
import { registerPatient } from './services/patient.service';

const patientSignupSchema = z.object({
    username: z.string(),
    email: z.email(),
    password: z.string().min(6),
    gender: z.string(),
    blood_type: z.string().optional(),
    phone_number: z.string(),
    country: z.string()
});

// Handler logic - routes HTTP requests to business logic
const logic = async (event: any, context: Context) => {
    const prisma = context.prisma;
    const path = event.path || event.resource;
    const method = event.httpMethod;

    if (method === 'OPTIONS') {
        return { statusCode: 200, body: '' };
    }

    if (path.includes('/patient_signup') && method === 'POST') {
        const patient = await registerPatient(prisma, event.body);
        return {
            statusCode: 201,
            body: patient
        };
    }

    return {
        statusCode: 404,
        body: { message: "Not Found" }
    };
};

// Export handler wrapped in middleware
export const handler = commonMiddleware(logic, {
    '/patient_signup': patientSignupSchema
});