/**
 * No-op mail service – placeholder for profiles without a real implementation.
 */
export const mailServiceNoop = {
    async send(_options) {
        throw new Error(`Mail service not configured for profile "${process.env.NODE_ENV ?? 'unknown'}". ` +
            'Add a production implementation (e.g. SMTP, SendGrid) or use development profile with Ethereal.');
    },
};
