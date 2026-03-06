import { Router } from "express"
import { createPatientAuthRoutes } from "./auth.routes"

export function createPatientRouter(): Router {
  const patientRouter = Router()
  patientRouter.use("/auth", createPatientAuthRoutes())
  return patientRouter
}

