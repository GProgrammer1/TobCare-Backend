import bcrypt from 'bcrypt';
import { BLOODTYPE } from "../generated/prisma/enums.js";
import { getMailService } from "./mail/index.js";
import { consumeOtp, generateOtp, storeOtp } from "../utils/otp.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
const BCRYPT_ROUNDS = 10;
const BLOOD_TYPE_MAP = {
    'A+': BLOODTYPE.A_pos,
    'A-': BLOODTYPE.A_neg,
    'B+': BLOODTYPE.B_pos,
    'B-': BLOODTYPE.B_neg,
    'O+': BLOODTYPE.O_pos,
    'O-': BLOODTYPE.O_neg,
    'AB+': BLOODTYPE.AB_pos,
    'AB-': BLOODTYPE.AB_neg,
};
export async function sendOtpToEmail(email) {
    const otp = generateOtp();
    storeOtp(email, otp);
    const mail = getMailService();
    await mail.send({
        to: email,
        subject: 'TobCare – Your verification code',
        template: 'otp',
        context: { otp },
    });
}
export async function registerPatient(prisma, input) {
    if (!consumeOtp(input.email, input.otp)) {
        throw new Error('INVALID_OTP');
    }
    const patientRole = await prisma.userRole.findUnique({
        where: { role: 'PATIENT' },
    });
    if (!patientRole) {
        throw new Error('PATIENT_ROLE_NOT_FOUND');
    }
    const country = await prisma.country.findUnique({
        where: { id: BigInt(input.countryId) },
    });
    if (!country) {
        throw new Error('COUNTRY_NOT_FOUND');
    }
    const digitsOnly = input.phoneNumber.replace(/\D/g, '');
    const fullPhone = country.phoneCode + digitsOnly;
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const bloodTypePrisma = BLOOD_TYPE_MAP[input.bloodType];
    if (!bloodTypePrisma) {
        throw new Error('INVALID_BLOOD_TYPE');
    }
    const user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
            data: {
                username: input.username,
                firstName: input.firstName,
                lastName: input.lastName,
                email: input.email,
                passwordHash,
                phoneNumber: fullPhone,
                countryId: BigInt(input.countryId),
                roleId: patientRole.id,
            },
        });
        await tx.patient.create({
            data: {
                userId: newUser.id,
                dateOfBirth: new Date(input.dateOfBirth),
                gender: input.gender,
                bloodType: bloodTypePrisma,
                address: input.address,
            },
        });
        return newUser;
    });
    const payload = {
        userId: user.id.toString(),
        role: patientRole.role,
    };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    return {
        authResponse: {
            userId: payload.userId,
            role: payload.role,
            accessToken,
        },
        refreshToken,
    };
}
