import { commonMiddleware } from './common/middleware';
import { Context } from 'aws-lambda';
import { getAllHospitals } from './services/hospital.service';

const logic = async (event: any, context: Context) => {
    const prisma = context.prisma;
    const path = event.path || event.resource;
    const method = event.httpMethod;

    if (method === 'OPTIONS') {
        return { statusCode: 200, body: '' };
    }

    if (path.includes('/hospitals') && method === 'GET') {
        const hospitals = await getAllHospitals(prisma);
        return {
            statusCode: 200,
            body: { hospitals }
        };
    }

    return {
        statusCode: 404,
        body: { message: "Not Found" }
    };
};

export const handler = commonMiddleware(logic);

