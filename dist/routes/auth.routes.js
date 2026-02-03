import { Router } from 'express';
import { sendOtp } from "../controllers/auth.controller.js";
const router = Router();
router.post('/send-otp', sendOtp);
export default router;
