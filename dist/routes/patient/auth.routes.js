import { Router } from 'express';
import { registerPatientController } from "../../controllers/patient.controller.js";
const router = Router();
router.post('/register', registerPatientController);
export default router;
