import { PrismaClient } from '../../lib/generated/prisma';
import { ServerClient } from 'postmark';

export interface RequestOtpInput {
    email: string;
}

export interface VerifyOtpInput {
    email: string;
    password: string;
    otp: string;
}

const POSTMARK_API_KEY = process.env.POSTMARK_API_KEY;
const POSTMARK_FROM_EMAIL = process.env.POSTMARK_FROM_EMAIL || 'noreply@tobcare.com';

let postmarkClient: ServerClient | null = null;
if (POSTMARK_API_KEY) {
    postmarkClient = new ServerClient(POSTMARK_API_KEY);
}

/**
 * Generate a random 6-digit OTP
 */
function generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Request OTP for login - generates OTP, stores it, and sends email
 */
export async function requestLoginOtp(
    prisma: PrismaClient,
    input: RequestOtpInput
): Promise<{ message: string }> {
    const { email } = input;

    // Find user by email
    const user = await prisma.users.findUnique({
        where: { email },
        include: { roles: true }
    });

    if (!user) {
        // Don't reveal if user exists for security
        return { message: 'If an account exists with this email, an OTP has been sent.' };
    }

    // Generate OTP
    const otpCode = generateOtp();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP expires in 10 minutes

    // Delete any existing unused OTPs for this user
    await prisma.login_otps.deleteMany({
        where: {
            user_id: user.id,
            used: false
        }
    });

    // Create new OTP record
    await prisma.login_otps.create({
        data: {
            user_id: user.id,
            email: user.email,
            otp_code: otpCode,
            expires_at: expiresAt,
            used: false
        }
    });

    // Send email via Postmark
    if (postmarkClient) {
        try {
            await postmarkClient.sendEmail({
                From: POSTMARK_FROM_EMAIL,
                To: email,
                Subject: 'Your TobCare Login OTP',
                TextBody: `Your TobCare login OTP is: ${otpCode}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this code, please ignore this email.`,
                HtmlBody: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2563eb;">TobCare Login OTP</h2>
                        <p>Your login verification code is:</p>
                        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; border-radius: 8px;">
                            ${otpCode}
                        </div>
                        <p>This code will expire in <strong>10 minutes</strong>.</p>
                        <p style="color: #6b7280; font-size: 14px;">If you did not request this code, please ignore this email.</p>
                    </div>
                `
            });
        } catch (error) {
            console.error('Error sending email via Postmark:', error);
            // Don't fail the request if email fails, but log it
        }
    } else {
        console.warn('POSTMARK_API_KEY not set, skipping email send');
        console.log(`OTP for ${email}: ${otpCode} (expires at ${expiresAt.toISOString()})`);
    }

    return { message: 'If an account exists with this email, an OTP has been sent.' };
}

/**
 * Verify OTP and get valid OTP record
 */
export async function verifyOtp(
    prisma: PrismaClient,
    email: string,
    otpCode: string
): Promise<{ valid: boolean; userId?: bigint }> {
    // Find valid OTP (not used, not expired, matches email and code)
    const otpRecord = await prisma.login_otps.findFirst({
        where: {
            email,
            otp_code: otpCode,
            used: false,
            expires_at: {
                gt: new Date()
            }
        },
        orderBy: {
            created_at: 'desc'
        }
    });

    if (!otpRecord) {
        return { valid: false };
    }

    // Mark OTP as used
    await prisma.login_otps.update({
        where: { id: otpRecord.id },
        data: { used: true }
    });

    return { valid: true, userId: otpRecord.user_id };
}

