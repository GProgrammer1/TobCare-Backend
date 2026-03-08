import { Request, Response } from "express"
import { injectable, inject } from "tsyringe"
import { AuthService } from "../services/auth.service"
import { LoginDto, OtpRequestDto, UserSignupDto } from "common/dtos/auth.dto"
import { asyncHandler } from "common/middlewares/async-handler"
import { OtpVerificationDto } from "packages/patient/dtos/auth.dto"
import { env } from "common/lib/env"

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? "strict" as const : "lax" as const,
  path: "/",
}

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

  login = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.authService.login(req.body as LoginDto)

    res.cookie("access_token", result.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: env.JWT_ACCESS_EXPIRY_SECONDS * 1000,
    })

    res.cookie("refresh_token", result.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: env.JWT_REFRESH_EXPIRY_SECONDS * 1000,
    })

    res.status(200).json({ role: result.role })
  })

  logout = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.sub
    if (userId) {
      await this.authService.logout(userId)
    }
    res.clearCookie("access_token", COOKIE_OPTIONS)
    res.clearCookie("refresh_token", COOKIE_OPTIONS)
    res.status(200).json({ message: "Logged out successfully" })
  })

  refresh = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refresh_token
    if (!refreshToken) {
      res.status(401).json({ message: "No refresh token provided" })
      return
    }

    const result = await this.authService.refresh(refreshToken)

    res.cookie("access_token", result.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: env.JWT_ACCESS_EXPIRY_SECONDS * 1000,
    })

    res.status(200).json({ role: result.role })
  })

  me = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user
    if (!user) {
      res.status(401).json({ message: "Not authenticated" })
      return
    }
    const result = await this.authService.getMe(user.sub, user.role)
    res.status(200).json(result)
  })
}