/**
 * Mail service types
 */

export type SendMailOptions = {
  to: string | string[]
  subject: string
  text?: string
  html?: string
  template?: string
  context?: Record<string, unknown>
  replyTo?: string
  cc?: string | string[]
  bcc?: string | string[]
}

export type SendMailResult = {
  messageId: string
  accepted: string[]
  rejected: string[]
}
