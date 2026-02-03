import { Router } from 'express'
import { registerPatientController } from '../../controllers/patient.controller.ts'

const router = Router()

router.post('/register', registerPatientController)

export default router
