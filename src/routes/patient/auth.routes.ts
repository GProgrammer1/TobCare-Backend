import { Router } from 'express'
import {
    registerPatientController,
    loginPatientController,
    verifyPatientLoginOtpController,
    forgotPasswordController,
    resetPasswordController,
} from '../../controllers/patient.controller.ts'

const router = Router()

router.post('/register', registerPatientController)
router.post('/login', loginPatientController)
router.post('/verify-otp', verifyPatientLoginOtpController)
router.post('/forgot-password', forgotPasswordController)
router.post('/reset-password', resetPasswordController)

export default router
