import { PrismaClient } from '../../lib/generated/prisma';
import * as argon2 from 'argon2';
import * as jwt from 'jsonwebtoken';

export interface LoginInput {
    email: string;
    password: string;
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
 * Business logic for patient login
 */
export async function loginPatient(
    prisma: PrismaClient,
    input: LoginInput
): Promise<{ loginResult: LoginResult; refreshToken: string }> {
    // Find user by email
    const user = await prisma.users.findUnique({
        where: { email: input.email },
        include: { roles: true }
    });

    if (!user) {
        throw new Error("Invalid email or password");
    }

    // Verify password
    const isValidPassword = await argon2.verify(user.password_hash, input.password);
    if (!isValidPassword) {
        throw new Error("Invalid email or password");
    }

    // Generate tokens
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

