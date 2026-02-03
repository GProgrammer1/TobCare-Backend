/**
 * Mail service interface.
 */

import type { SendMailOptions, SendMailResult } from './mail.service.types.ts'

export type IMailService = {
  send(options: SendMailOptions): Promise<SendMailResult>
}
