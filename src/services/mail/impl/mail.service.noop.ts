/**
 * No-op mail service – placeholder for profiles without a real implementation.
 */

import type { IMailService } from '../mail.service.interface.ts'
import type { SendMailOptions, SendMailResult } from '../mail.service.types.ts'

export const mailServiceNoop: IMailService = {
  async send(_options: SendMailOptions): Promise<SendMailResult> {
    throw new Error(
      `Mail service not configured for profile "${process.env.NODE_ENV ?? 'unknown'}". ` +
        'Add a production implementation (e.g. SMTP, SendGrid) or use development profile with Ethereal.'
    )
  },
}
