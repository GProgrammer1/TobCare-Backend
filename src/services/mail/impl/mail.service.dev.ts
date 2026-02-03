/**
 * Dev mail service – Nodemailer + Ethereal.
 */

import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import Handlebars from 'handlebars'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import type { IMailService } from '../mail.service.interface.ts'
import type { SendMailOptions, SendMailResult } from '../mail.service.types.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))

let transporter: Transporter | null = null

async function getTransporter(): Promise<Transporter> {
  if (transporter) return transporter

  const account = await nodemailer.createTestAccount()
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: account.user,
      pass: account.pass,
    },
  })
  console.log('[MailService:dev] Ethereal account:', account.user)
  return transporter
}

function getPublicDir(): string {
  return join(process.cwd(), 'public', 'emails')
}

function getTemplatesDir(): string {
  return join(getPublicDir(), 'templates')
}

function loadEmailStyles(): string {
  const cssPath = join(getPublicDir(), 'css', 'emails.css')
  try {
    return readFileSync(cssPath, 'utf-8')
  } catch {
    return ''
  }
}

function compileTemplate(templateName: string, context: Record<string, unknown>): string {
  const templatesDir = getTemplatesDir()
  const layoutPath = join(templatesDir, 'layout.hbs')
  const templatePath = join(templatesDir, `${templateName}.hbs`)

  let layout: Handlebars.TemplateDelegate
  let bodyTemplate: Handlebars.TemplateDelegate

  try {
    layout = Handlebars.compile(readFileSync(layoutPath, 'utf-8'))
  } catch {
    layout = Handlebars.compile('<html><body>{{{body}}}</body></html>')
  }

  try {
    bodyTemplate = Handlebars.compile(readFileSync(templatePath, 'utf-8'))
  } catch (err) {
    throw new Error(`Template "${templateName}" not found: ${err}`)
  }

  const bodyHtml = bodyTemplate(context)
  const emailStyles = loadEmailStyles()
  const fullContext = { ...context, body: bodyHtml, emailStyles }
  return layout(fullContext)
}

export const mailServiceDev: IMailService = {
  async send(options: SendMailOptions): Promise<SendMailResult> {
    const transport = await getTransporter()

    let html = options.html
    if (options.template) {
      const defaultContext = {
        subject: options.subject,
        headerTitle: 'TobCare',
        footerText: '© TobCare – Your Health Journey',
      }
      html = compileTemplate(options.template, { ...defaultContext, ...(options.context ?? {}) })
    }

    const to = Array.isArray(options.to) ? options.to : [options.to]
    const mailOptions = {
      from: process.env.MAIL_FROM ?? '"TobCare" <noreply@tobcare.local>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html,
      replyTo: options.replyTo,
      cc: options.cc,
      bcc: options.bcc,
    }

    const info = await transport.sendMail(mailOptions)
    const previewUrl = nodemailer.getTestMessageUrl(info)
    if (previewUrl) {
      console.log('[MailService:dev] Preview URL:', previewUrl)
    }

    return {
      messageId: info.messageId ?? '',
      accepted: info.accepted ?? [],
      rejected: info.rejected ?? [],
    }
  },
}
