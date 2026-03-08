import { inject, injectable } from "tsyringe"
import { container } from "tsyringe"
import { DoctorApplicationRepository } from "../repositories/doctor-application.repository"
import { doctorApplicationPayload as doctorApplicationPayloadSchema } from "../dtos/auth.dto"
import type { SetPasswordDto } from "../dtos/auth.dto"
import type { IFileStorageService } from "common/services/io/file-storage.service"
import type { IMailService } from "common/services/mail/mail.service"
import { TemplateRendererService } from "common/services/template-renderer.service"
import { generateStorageKey } from "common/utils/storage-key"
import { hmac256, argon2Hash } from "common/utils/encryption"
import { env } from "common/lib/env"
import { logger } from "common/lib/logger"
import { ARRAY_DOC_FIELDS, SINGLE_DOC_FIELDS } from "../constants/uploadFields"
import { RedisRepository } from "common/repositories/redis.repository"
import { UserRepository } from "common/repositories/user.repository"
import { BadRequestError } from "common/errors/errors"


@injectable()
export class DoctorAuthService {
  constructor(
    @inject("DoctorApplicationRepository")
    private doctorApplicationRepository: DoctorApplicationRepository,
    @inject("IFileStorageService")
    private fileStorageService: IFileStorageService,
    @inject("IMailService")
    private mailService: IMailService,
    @inject(TemplateRendererService)
    private templateRenderer: TemplateRendererService,
    @inject(RedisRepository) private redisRepository: RedisRepository,
    @inject("UserRepository") private userRepository: UserRepository,
  ) {}

  async apply(
    body: Record<string, unknown>,
    files: Record<string, Express.Multer.File[]>,
  ) {
    const email = body.email as string
    const docUrls: Record<string, string | string[]> = {}

    // Upload single-file document fields
    for (const field of SINGLE_DOC_FIELDS) {
      const fileArr = files[field]
      if (!fileArr?.[0]) continue

      const file = fileArr[0]
      const key = generateStorageKey(email, field, file.originalname, env.HMAC_SECRET)
      const result = await this.fileStorageService.uploadBuffer(
        file.buffer,
        key,
        file.mimetype,
      )
      docUrls[field] = result.url
    }

    // Upload array document fields (specialtyDocs)
    for (const field of ARRAY_DOC_FIELDS) {
      const fileArr = files[field]
      if (!fileArr?.length) continue

      const urls: string[] = []
      for (const file of fileArr) {
        const key = generateStorageKey(email, field, file.originalname, env.HMAC_SECRET)
        const result = await this.fileStorageService.uploadBuffer(
          file.buffer,
          key,
          file.mimetype,
        )
        urls.push(result.url)
      }
      docUrls[field] = urls
    }

    // Coerce multipart string values into their expected types
    const coerced: Record<string, unknown> = { ...body }

    // Boolean
    if (typeof coerced.isSpecialist === "string") {
      coerced.isSpecialist = coerced.isSpecialist === "true"
    }

    // Number
    if (typeof coerced.graduationYear === "string") {
      coerced.graduationYear = Number(coerced.graduationYear)
    }

    // JSON-encoded arrays from FormData
    for (const key of ["clinics", "hospitals"] as const) {
      if (typeof coerced[key] === "string") {
        try {
          coerced[key] = JSON.parse(coerced[key] as string)
        } catch {
          coerced[key] = []
        }
      }
    }

    // Ensure array fields that arrive as a single string become arrays
    for (const key of ["specialties", "acceptedInsurances"] as const) {
      if (typeof coerced[key] === "string") {
        coerced[key] = [coerced[key]]
      }
    }

    // Merge body text fields with uploaded document URLs and validate
    const payload = doctorApplicationPayloadSchema.parse({
      ...coerced,
      ...docUrls,
    })

    return this.createApplicationAndNotify(payload)
  }

  private async createApplicationAndNotify(payload: ReturnType<typeof doctorApplicationPayloadSchema.parse> extends infer T ? T : never) {
    const application = await this.doctorApplicationRepository.create(payload)

    // Fire-and-forget: send email + admin notification
    this.sendAdminNotification(application).catch((err) => {
      logger.error({ err }, "Failed to send admin notification for new application")
    })

    return application
  }

  private async sendAdminNotification(application: { id: bigint; firstName: string; lastName: string; email: string; specialties: string[] }) {
    const adminEmail = env.ADMIN_EMAIL
    if (!adminEmail) {
      logger.warn("ADMIN_EMAIL not set — skipping admin notification email")
    } else {
      // Send email
      const template = this.templateRenderer.loadTemplate(
        "mails/new-application",
        "styles/new-application",
      )
      const html = this.templateRenderer.render(template, {
        doctorName: `${application.firstName} ${application.lastName}`,
        doctorEmail: application.email,
        specialties: application.specialties.join(", "),
        applicationId: String(application.id),
        reviewUrl: `${env.CORS_ORIGIN}/admin/applications/${application.id}`,
      })
      await this.mailService.sendMail({
        to: adminEmail,
        subject: "New Doctor Application — TobCare",
        html,
      })
    }

    // Create persistent notification + broadcast via SSE
    try {
      const notificationService = container.resolve<{ createAndBroadcast: (p: any) => Promise<void> }>("NotificationService")
      await notificationService.createAndBroadcast({
        type: "NEW_APPLICATION" as any,
        title: "New Doctor Application",
        message: `Dr. ${application.firstName} ${application.lastName} has submitted an application.`,
        data: {
          applicationId: String(application.id),
          doctorName: `${application.firstName} ${application.lastName}`,
          email: application.email,
        },
      })
    } catch (err) {
      logger.error({ err }, "Failed to broadcast notification via SSE")
    }
  }

  async setPassword(dto: SetPasswordDto) {
    const redisKey = `set-password:${dto.token}`
    const applicationId = await this.redisRepository.get(redisKey)

    if (!applicationId) {
      throw new BadRequestError("Invalid or expired set-password link. Please contact support.")
    }

    // Fetch the doctor application to get PII for user creation
    const application = await this.doctorApplicationRepository.findById(BigInt(applicationId))
    if (!application) {
      throw new BadRequestError("Application not found.")
    }

    if (application.status !== "VERIFIED") {
      throw new BadRequestError("Application has not been approved.")
    }

    // Encrypt PII and hash password
    const encryptedEmail = hmac256(application.email, env.HMAC_SECRET)

    // Check if the user was already created (e.g. duplicate approval tokens)
    const existingUser = await this.userRepository.findUserByEmail(encryptedEmail)
    if (existingUser) {
      // User already exists — clean up the token and return success
      await this.redisRepository.del(redisKey)
      return { message: "Password set successfully. You can now log in." }
    }

    const passwordHash = await argon2Hash(dto.password)
    const encryptedUser = {
      firstName: hmac256(application.firstName, env.HMAC_SECRET),
      lastName: hmac256(application.lastName, env.HMAC_SECRET),
      email: encryptedEmail,
      passwordHash,
      role: "DOCTOR" as const,
      phoneNumber: hmac256(application.phone, env.HMAC_SECRET),
    }

    // Create the user account
    await this.userRepository.createUser(encryptedUser)

    // Invalidate the token so it can't be reused
    await this.redisRepository.del(redisKey)

    return { message: "Password set successfully. You can now log in." }
  }
}