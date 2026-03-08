import nodemailer from "nodemailer"
import type { SendMailOptions } from "nodemailer"
import * as aws from "@aws-sdk/client-ses"
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
      console.log("\n📧 Ethereal inbox:", webUrl, "\n")
      logger.info({ etherealUrl: webUrl }, "Ethereal test account created")
    }
    return this.transporter
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    const transporter = await this.getTransporter()
    const info = await transporter.sendMail(options)
    const previewUrl = nodemailer.getTestMessageUrl(info)
    if (previewUrl) {
      console.log("\n📧 Ethereal preview:", previewUrl, "\n")
    }
    logger.info(`Email sent: ${previewUrl ?? "no preview url"}`)
  }
}

@singleton()
export class ProdMailService implements IMailService {
  private transporter: ReturnType<typeof nodemailer.createTransport>

  constructor() {
    const ses = new aws.SESClient({ region: env.AWS_SES_REGION })
    this.transporter = nodemailer.createTransport({ SES: { ses, aws } })
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
