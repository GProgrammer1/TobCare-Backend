import { Router } from "express"
import { container } from "tsyringe"
import { AuthController } from "../controllers/auth.controller"
import { zodValidator } from "../middlewares/zodValidator"
import { otpRequestSchema, otpVerificationSchema, userSignupSchema } from "../dtos/auth.dto"

export function createAuthRoutes(): Router {
  const router = Router()
  const authController = container.resolve(AuthController)

  router.post("/signup", zodValidator(userSignupSchema), authController.signup)
  router.post("/send-otp", zodValidator(otpRequestSchema), authController.sendOtp)
  router.post("/verify-otp", zodValidator(otpVerificationSchema), authController.verifyOtp)
  return router
}
