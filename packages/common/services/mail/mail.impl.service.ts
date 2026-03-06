import nodemailer from "nodemailer"
import type { SendMailOptions } from "nodemailer"
import { singleton } from "tsyringe"
import { env } from "common/lib/env"
import type { IMailService } from "./mail.service"
import { logger } from "common/lib/logger"

@singleton()
export class DevMailService implements IMailService {
  private transporter: ReturnType<typeof nodemailer.createTransport> | null = null

  private async getTransporter() {
    if (!this.transporter) {
      const account = await nodemailer.createTestAccount()
      this.transporter = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: { user: account.user, pass: account.pass },
      })
    }
    return this.transporter
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    const transporter = await this.getTransporter()
    const info = await transporter.sendMail(options)
    logger.info(`Email sent: ${nodemailer.getTestMessageUrl(info)}`)
  }
}

@singleton()
export class ProdMailService implements IMailService {
  private transporter: ReturnType<typeof nodemailer.createTransport>

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE === "true",
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    })
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    await this.transporter.sendMail({
      from: env.SMTP_FROM ?? env.SMTP_USER,
      ...options,
    })
  }
}

export const MailService =
  env.NODE_ENV === "production" ? ProdMailService : DevMailService
