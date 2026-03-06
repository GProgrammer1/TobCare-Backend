import { inject, injectable } from "tsyringe";
import { PatientAuthService } from "../services/auth.service";
import { asyncHandler } from "common/middlewares/async-handler";
import { Request, Response, NextFunction } from "express";
import { PatientSignupDto } from "patient/dtos/auth.dto";

@injectable()
export class PatientAuthController {
    constructor(@inject("PatientAuthService") private patientAuthService: PatientAuthService){}

    signup = asyncHandler(async(_req: Request, _res: Response, next: NextFunction) => {
        const patientSignupResult = await this.patientAuthService.signupPatient(_req.body as PatientSignupDto)
        _res.status(201).json(patientSignupResult)
    })
}