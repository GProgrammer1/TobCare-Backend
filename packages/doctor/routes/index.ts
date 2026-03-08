import { Router } from "express"
import { createDoctorAuthRoutes } from "./auth.routes"

export function createDoctorRouter(): Router {
  const router = Router()
  router.use("/auth", createDoctorAuthRoutes())
  return router
}

