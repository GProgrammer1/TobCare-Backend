import { inject, injectable } from "tsyringe"
import type { Request, Response } from "express"
import { DoctorAuthService } from "../services/auth.service"
import { asyncHandler } from "common/middlewares/async-handler"
import type { SetPasswordDto } from "../dtos/auth.dto"

@injectable()
export class DoctorAuthController {
  constructor(
    @inject("DoctorAuthService") private doctorAuthService: DoctorAuthService,
  ) {}

  apply = asyncHandler(async (req: Request, res: Response) => {
    const files = req.files as Record<string, Express.Multer.File[]> | undefined
    const result = await this.doctorAuthService.apply(req.body, files ?? {})
    res.status(201).json(result)
  })

  setPassword = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.doctorAuthService.setPassword(req.body as SetPasswordDto)
    res.status(200).json(result)
  })
}