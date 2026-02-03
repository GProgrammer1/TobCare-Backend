import type { PrismaClient } from '../generated/prisma/client.ts'

/**
 * Removes expired refresh tokens and password reset tokens from the database.
 */
export async function cleanupExpiredTokens(prisma: PrismaClient): Promise<void> {
    const now = new Date()

    try {
        const expiredRefreshTokens = await prisma.refreshToken.deleteMany({
            where: {
                expiresAt: {
                    lt: now,
                },
            },
        })

        const expiredResetTokens = await prisma.passwordResetToken.deleteMany({
            where: {
                expiresAt: {
                    lt: now,
                },
            },
        })

        console.log(`[Cleanup Job] Removed ${expiredRefreshTokens.count} expired refresh tokens and ${expiredResetTokens.count} expired reset tokens.`)
    } catch (error) {
        console.error('[Cleanup Job] Failed to remove expired tokens:', error)
    }
}
