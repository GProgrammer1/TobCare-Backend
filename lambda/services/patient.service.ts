import { PrismaClient } from '../../lib/generated/prisma';
import * as argon2 from 'argon2';
import { encrypt } from '../common/encryption';

export interface PatientSignupInput {
    username: string;
    email: string;
    password: string;
    gender: string;
    blood_type?: string;
    phone_number: string;
    country: string;
}

export interface PatientSignupResult {
    id: bigint;
    user_id: bigint;
    gender_id: number;
    blood_type_id: number | null;
    phone_number: string;
    country_id: bigint;
}

/**
 * Business logic for patient registration
 * This function contains the core logic and can be unit tested independently
 */
export async function registerPatient(
    prisma: PrismaClient,
    input: PatientSignupInput
): Promise<PatientSignupResult> {
    // Hash password with Argon2
    const password_hash = await argon2.hash(input.password);

    // Encrypt sensitive info
    const encrypted_phone = encrypt(input.phone_number);

    // Find role
    const patientRole = await prisma.roles.findUnique({ where: { name: 'patient' } });
    if (!patientRole) {
        throw new Error("Patient role not found");
    }

    const result = await prisma.$transaction(async (tx: any) => {
        // Create User
        const user = await tx.users.create({
            data: {
                username: input.username,
                email: input.email,
                password_hash,
                role_id: patientRole.id
            }
        });

        // Handle Country
        let countryRecord = await tx.countries.findFirst({
            where: { name: { equals: input.country, mode: 'insensitive' } }
        });
        if (!countryRecord) {
            countryRecord = await tx.countries.create({
                data: { name: input.country, phone_code: '000' }
            });
        }

        // Handle Gender
        let genderRecord = await tx.genders.findUnique({ where: { code: input.gender } });
        if (!genderRecord) {
            genderRecord = await tx.genders.create({ data: { code: input.gender } });
        }

        // Handle Blood Type
        let bloodTypeRecord = null;
        if (input.blood_type) {
            bloodTypeRecord = await tx.blood_types.findUnique({ where: { code: input.blood_type } });
            if (!bloodTypeRecord) {
                bloodTypeRecord = await tx.blood_types.create({ data: { code: input.blood_type } });
            }
        }

        // Create Patient
        const patient = await tx.patients.create({
            data: {
                user_id: user.id,
                gender_id: genderRecord.id,
                blood_type_id: bloodTypeRecord ? bloodTypeRecord.id : null,
                country_id: countryRecord.id,
                phone_number: encrypted_phone
            }
        });

        return patient;
    });

    return result;
}

