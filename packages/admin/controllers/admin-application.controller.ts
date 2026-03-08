import { inject, injectable } from "tsyringe"
import type { Request, Response } from "express"
import { AdminApplicationService } from "../services/admin-application.service"
import { asyncHandler } from "common/middlewares/async-handler"
import { listApplicationsQuerySchema, updateApplicationStatusSchema } from "../dtos/admin.dto"
import type { ApplicationStatus } from "@tobcare/prisma"

@injectable()
export class AdminApplicationController {
  constructor(
    @inject("AdminApplicationService")
    private adminApplicationService: AdminApplicationService,
  ) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const query = listApplicationsQuerySchema.parse(req.query)
    const result = await this.adminApplicationService.listApplications(query)
    res.status(200).json(result)
  })

  getById = asyncHandler(async (req: Request, res: Response) => {
    const id = BigInt(req.params.id as string)
    const application = await this.adminApplicationService.getApplication(id)
    res.status(200).json(application)
  })

  updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const id = BigInt(req.params.id as string)
    const { status, adminNotes } = updateApplicationStatusSchema.parse(req.body)
    // TODO: Extract adminId from authenticated user (JWT) once auth middleware is in place.
    // For now, use a placeholder admin ID.
    const adminId = BigInt(1)
    const result = await this.adminApplicationService.updateApplicationStatus(
      id,
      status as ApplicationStatus,
      adminId,
      adminNotes,
    )
    res.status(200).json(result)
  })

  statusCounts = asyncHandler(async (_req: Request, res: Response) => {
    const counts = await this.adminApplicationService.getStatusCounts()
    res.status(200).json(counts)
  })
}
