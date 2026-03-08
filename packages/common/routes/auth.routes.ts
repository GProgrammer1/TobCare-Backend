import { Router } from "express"
import { container } from "tsyringe"
import { AuthController } from "../controllers/auth.controller"
import { zodValidator } from "../middlewares/zodValidator"
import { loginSchema, otpRequestSchema, otpVerificationSchema, userSignupSchema } from "../dtos/auth.dto"
import { authMiddleware } from "../middlewares/auth.middleware"

export function createAuthRoutes(): Router {
  const router = Router()
  const authController = container.resolve(AuthController)

  router.post("/signup", zodValidator(userSignupSchema), authController.signup)
  router.post("/send-otp", zodValidator(otpRequestSchema), authController.sendOtp)
  router.post("/verify-otp", zodValidator(otpVerificationSchema), authController.verifyOtp)
  router.post("/login", zodValidator(loginSchema), authController.login)
  router.post("/logout", authMiddleware, authController.logout)
  router.post("/refresh", authController.refresh)
  router.get("/me", authMiddleware, authController.me)
  return router
}
