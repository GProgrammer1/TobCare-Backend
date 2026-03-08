import { inject, injectable } from "tsyringe"
import { AdminApplicationRepository } from "../repositories/admin-application.repository"
import { NotFoundError } from "common/errors/errors"
import type { ApplicationStatus } from "@tobcare/prisma"
import type { ListApplicationsQueryDto } from "../dtos/admin.dto"
import type { IMailService } from "common/services/mail/mail.service"
import { TemplateRendererService } from "common/services/template-renderer.service"
import { RedisRepository } from "common/repositories/redis.repository"
import { generateSecureToken } from "common/utils/encryption"
import { emailSubjects } from "common/constants/email-subjects"
import { env } from "common/lib/env"
import { logger } from "common/lib/logger"

@injectable()
export class AdminApplicationService {
  constructor(
    @inject("AdminApplicationRepository")
    private adminApplicationRepository: AdminApplicationRepository,
    @inject(RedisRepository) private redisRepository: RedisRepository,
    @inject("IMailService") private mailService: IMailService,
    @inject(TemplateRendererService) private templateRenderer: TemplateRendererService,
  ) {}

  async listApplications(query: ListApplicationsQueryDto) {
    return this.adminApplicationRepository.findAll(query)
  }

  async getApplication(id: bigint) {
    const application = await this.adminApplicationRepository.findById(id)
    if (!application) {
      throw new NotFoundError(`Doctor application with id ${id} not found`)
    }
    return application
  }

  async updateApplicationStatus(
    id: bigint,
    status: ApplicationStatus,
    adminId: bigint,
    adminNotes?: string,
  ) {
    const existing = await this.adminApplicationRepository.findById(id)
    if (!existing) {
      throw new NotFoundError(`Doctor application with id ${id} not found`)
    }

    const updated = await this.adminApplicationRepository.updateStatus(id, status, adminId, adminNotes)

    // Only fire side effects when the status actually changes
    if (status === "VERIFIED" && existing.status !== "VERIFIED") {
      this.handleApproval(existing).catch((err) => {
        logger.error({ err }, "Failed to handle application approval side effects")
      })
    } else if (status === "REJECTED" && existing.status !== "REJECTED") {
      this.handleRejection(existing, adminNotes).catch((err) => {
        logger.error({ err }, "Failed to handle application rejection side effects")
      })
    }

    return updated
  }

  async getStatusCounts() {
    return this.adminApplicationRepository.countByStatus()
  }

  private async handleApproval(application: {
    id: bigint
    firstName: string
    lastName: string
    email: string
  }) {
    // Generate a secure token and store in Redis with the application ID
    const token = generateSecureToken()
    const redisKey = `set-password:${token}`
    await this.redisRepository.set(redisKey, String(application.id), env.SET_PASSWORD_TTL_SECONDS)

    // Build the set-password URL
    const setPasswordUrl = `${env.CORS_ORIGIN}/doctor/set-password?token=${token}`

    // Send approval email
    const template = this.templateRenderer.loadTemplate(
      "mails/application-approved",
      "styles/application-approved",
    )
    const html = this.templateRenderer.render(template, {
      doctorName: `${application.firstName} ${application.lastName}`,
      setPasswordUrl,
    })
    await this.mailService.sendMail({
      to: application.email,
      subject: emailSubjects.applicationApproved,
      html,
    })
  }

  private async handleRejection(
    application: { firstName: string; lastName: string; email: string },
    adminNotes?: string,
  ) {
    const template = this.templateRenderer.loadTemplate(
      "mails/application-rejected",
      "styles/application-rejected",
    )
    const html = this.templateRenderer.render(template, {
      doctorName: `${application.firstName} ${application.lastName}`,
      adminNotes: adminNotes ?? "",
    })
    await this.mailService.sendMail({
      to: application.email,
      subject: emailSubjects.applicationRejected,
      html,
    })
  }
}
