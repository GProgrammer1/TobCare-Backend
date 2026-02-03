/**
 * Mail service factory – profile-based implementation selection.
 * Similar to Spring Boot @Profile: only the implementation matching
 * the current NODE_ENV (profile) is picked.
 */

import type { IMailService } from './mail.service.interface.ts'
import { mailServiceDev } from './impl/mail.service.dev.ts'
import { mailServiceNoop } from './impl/mail.service.noop.ts'

const profile = process.env.NODE_ENV ?? 'development'

function createMailService(): IMailService {
  if (profile === 'development') {
    return mailServiceDev
  }
  if (profile === 'production') {
    return mailServiceNoop
  }
  return mailServiceDev
}

let instance: IMailService | null = null

export function getMailService(): IMailService {
  if (!instance) {
    instance = createMailService()
    console.log(`[MailService] Using implementation for profile: ${profile}`)
  }
  return instance
}
