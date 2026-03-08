import { Router } from "express"
import multer from "multer"
import { container } from "common/container/registry"
import { DoctorAuthController } from "../controllers/auth.controller"
import { zodValidator } from "common/middlewares/zodValidator"
import { setPasswordSchema } from "../dtos/auth.dto"

const upload = multer({ storage: multer.memoryStorage() })

const doctorApplicationUpload = upload.fields([
  { name: "nationalIdDoc", maxCount: 1 },
  { name: "lopCertificateDoc", maxCount: 1 },
  { name: "medicalDegreeDoc", maxCount: 1 },
  { name: "mophLicenseDoc", maxCount: 1 },
  { name: "specialtyDocs", maxCount: 10 },
  { name: "colloquiumDoc", maxCount: 1 },
  { name: "criminalRecordDoc", maxCount: 1 },
  { name: "passportPhotoDoc", maxCount: 1 },
])

export function createDoctorAuthRoutes(): Router {
  const router = Router()
  const doctorAuthController = container.resolve(DoctorAuthController)
  router.post("/apply", doctorApplicationUpload, doctorAuthController.apply)
  router.post("/set-password", zodValidator(setPasswordSchema), doctorAuthController.setPassword)
  return router
}