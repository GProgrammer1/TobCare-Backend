import { container } from "../container/registry"
import { Router } from "express"
import { PatientAuthController } from "../controllers/auth.controller"
import { zodValidator } from "common/middlewares/zodValidator"
import { patientSignupSchema } from "patient/dtos/auth.dto"

export function createPatientAuthRoutes(): Router {
    const patientAuthRouter = Router()
    const patientAuthController = container.resolve(PatientAuthController)
  
    patientAuthRouter.post("/signup", zodValidator(patientSignupSchema), patientAuthController.signup)
  
    return patientAuthRouter
  }
  