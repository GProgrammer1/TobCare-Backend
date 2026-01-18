import { PrismaClient } from '../../lib/generated/prisma';
import * as argon2 from 'argon2';
import * as jwt from 'jsonwebtoken';
import { verifyOtp } from './otp.service';

export interface LoginInput {
    email: string;
    password: string;
    otp: string;
}

export interface LoginResult {
    userid: string;
    role: string;
    accessToken: string;
}

/**
 * Generate JWT access token
 */
function generateAccessToken(userId: bigint, roleId: number, roleName: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET environment variable is not set");
    }

    return jwt.sign(
        {
            userId: userId.toString(),
            roleId,
            role: roleName,
            type: 'access'
        },
        secret,
        { expiresIn: '15m' }
    );
}

/**
 * Generate JWT refresh token
 */
function generateRefreshToken(userId: bigint, roleId: number, roleName: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET environment variable is not set");
    }

    return jwt.sign(
        {
            userId: userId.toString(),
            roleId,
            role: roleName,
            type: 'refresh'
        },
        secret,
        { expiresIn: '7d' }
    );
}

/**
 * Business logic for patient login with OTP verification
 */
export async function loginPatient(
    prisma: PrismaClient,
    input: LoginInput
): Promise<{ loginResult: LoginResult; refreshToken: string }> {
    const { email, password, otp } = input;

    // Find user by email
    const user = await prisma.users.findUnique({
        where: { email },
        include: { roles: true }
    });

    if (!user) {
        throw new Error("Invalid email, password, or OTP");
    }

    // Verify password
    const isValidPassword = await argon2.verify(user.password_hash, password);
    if (!isValidPassword) {
        throw new Error("Invalid email, password, or OTP");
    }

    // Verify OTP
    const otpVerification = await verifyOtp(prisma, email, otp);
    if (!otpVerification.valid || otpVerification.userId?.toString() !== user.id.toString()) {
        throw new Error("Invalid email, password, or OTP");
    }

    // Generate tokens (only after successful password and OTP verification)
    const accessToken = generateAccessToken(user.id, user.role_id, user.roles.name);
    const refreshToken = generateRefreshToken(user.id, user.role_id, user.roles.name);

    // Update last_login_at
    await prisma.users.update({
        where: { id: user.id },
        data: { last_login_at: new Date() }
    });

    return {
        loginResult: {
            userid: user.id.toString(),
            role: user.roles.name,
            accessToken
        },
        refreshToken
    };
}

