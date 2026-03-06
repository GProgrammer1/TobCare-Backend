import { container } from "../container/registry"
import { Router } from "express"
import { PatientAuthController } from "../controllers/auth.controller"

export function createPatientAuthRoutes(): Router {
    const patientAuthRouter = Router()
    const patientAuthController = container.resolve(PatientAuthController)
  
    patientAuthRouter.post("/signup", patientAuthController.signup)
  
    return patientAuthRouter
  }
  