import { Request, Response } from "express"
import { injectable, inject } from "tsyringe"
import { AuthService } from "../services/auth.service"
import { OtpRequestDto, UserSignupDto } from "common/dtos/auth.dto"
import { asyncHandler } from "common/middlewares/async-handler"
import { OtpVerificationDto } from "packages/patient/dtos/auth.dto"

@injectable()
export class AuthController {
  constructor(@inject(AuthService) private authService: AuthService) {}

  signup = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.authService.signupUser(req.body as UserSignupDto)
    res.status(201).json(user)
  })

  verifyOtp = asyncHandler(async (req: Request, res: Response) => {
    const otpVerificationResult = await this.authService.verifyOtp(req.body as OtpVerificationDto)
    res.status(200).json(otpVerificationResult)
  })

  sendOtp = asyncHandler(async (req: Request, res: Response) => {
    const otpRequestResult = await this.authService.sendOtp(req.body as OtpRequestDto)
    res.status(200).json(otpRequestResult)
  })
}