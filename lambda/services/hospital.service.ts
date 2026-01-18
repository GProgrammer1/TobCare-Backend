import { PrismaClient } from '../../lib/generated/prisma';

export interface Hospital {
    id: bigint;
    name: string;
    region: string;
    phone_number: string | null;
}

/**
 * Business logic for retrieving hospitals
 * This function contains the core logic and can be unit tested independently
 */
export async function getAllHospitals(prisma: PrismaClient): Promise<Hospital[]> {
    const hospitals = await prisma.hospitals.findMany({
        select: { id: true, name: true, region: true, phone_number: true }
    });

    return hospitals;
}

