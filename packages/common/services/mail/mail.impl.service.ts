import nodemailer from "nodemailer"
import type { SendMailOptions } from "nodemailer"
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2"
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
      const webUrl = (account as { web?: string }).web ?? "https://ethereal.email"
      logger.info({ etherealUrl: webUrl }, "Ethereal test account created")
    }
    return this.transporter
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    const transporter = await this.getTransporter()
    const info = await transporter.sendMail(options)
    const previewUrl = nodemailer.getTestMessageUrl(info)
    logger.info({ previewUrl: previewUrl ?? undefined }, "Email sent")
  }
}

@singleton()
export class ProdMailService implements IMailService {
  private transporter: ReturnType<typeof nodemailer.createTransport>

  constructor() {
    const region = env.AWS_SES_REGION ?? "us-east-1"
    const sesClient = new SESv2Client({ region })
    this.transporter = nodemailer.createTransport({
      SES: { sesClient, SendEmailCommand },
    })
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    await this.transporter.sendMail({
      from: env.SMTP_FROM,
      ...options,
    })
  }
}

export const MailService =
  env.NODE_ENV === "production" ? ProdMailService : DevMailService
