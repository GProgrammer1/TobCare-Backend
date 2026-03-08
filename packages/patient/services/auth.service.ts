import { inject, injectable } from "tsyringe"
import { PatientRepository } from "../repositories/patient.repository"
import {
  EncryptedPatientSignupDto,
  PatientSignupDto,
} from "../dtos/auth.dto"
import { env } from "common/lib/env"
import { UserRepository } from "common/repositories/user.repository"
import { UserAlreadyExistsError } from "common/errors/errors"
import { argon2Hash, hmac256 } from "common/utils/encryption"
import { logger } from "common/lib/logger"

@injectable()
export class PatientAuthService {
  constructor(
    @inject("PatientRepository") private patientRepository: PatientRepository,
    @inject(UserRepository) private userRepository: UserRepository,
  ) {}

  async signupPatient(patientSignupRequest: PatientSignupDto) {
    const existingUser = await this.userRepository.findUserByEmail(
      patientSignupRequest.email,
    )
    if (existingUser) {
      throw new UserAlreadyExistsError()
    }
    const encrypted = await this.encryptPatientSignupRequest(patientSignupRequest)
    const result = await this.patientRepository.createPatient(encrypted)
    logger.info({ patientId: result?.id != null ? String(result.id) : undefined }, "Patient signup")
    return result
  }

  async encryptPatientSignupRequest(
    req: PatientSignupDto,
  ): Promise<EncryptedPatientSignupDto> {
    const secret = env.HMAC_SECRET
    return {
      firstName: hmac256(req.firstName, secret),
      lastName: hmac256(req.lastName, secret),
      email: hmac256(req.email, secret),
      passwordHash: await argon2Hash(req.password),
      role: req.role,
      phoneNumber: hmac256(String(req.phoneNumber), secret),
      dateOfBirth: hmac256(String(req.dateOfBirth), secret),
      emergencyContacts: req.emergencyContacts?.map((c) => ({
        name: hmac256(c.name, secret),
        phoneNumber: hmac256(String(c.phoneNumber), secret),
      })),
      diseases: req.diseases?.map((d) => ({
        name: hmac256(d.name, secret),
        diagnosedYear: d.diagnosedYear,
        diagnosedMonth: d.diagnosedMonth,
      })),
      allergies: req.allergies?.map((a) => ({
        name: hmac256(a.name, secret),
        diagnosedYear: a.diagnosedYear,
        diagnosedMonth: a.diagnosedMonth,
        severity: a.severity,
      })),
      medications: req.medications?.map((m) => ({
        name: hmac256(m.name, secret),
        dose: hmac256(m.dose, secret),
        frequency: hmac256(m.frequency, secret),
        prescribedYear: m.prescribedYear,
        prescribedMonth: m.prescribedMonth,
        ...(m.allergy && {
          allergy: {
            name: hmac256(m.allergy.name, secret),
            diagnosedYear: m.allergy.diagnosedYear,
            diagnosedMonth: m.allergy.diagnosedMonth,
            severity: m.allergy.severity,
          },
        }),
        ...(m.disease && {
          disease: {
            name: hmac256(m.disease.name, secret),
            diagnosedYear: m.disease.diagnosedYear,
            diagnosedMonth: m.disease.diagnosedMonth,
          },
        }),
      })),
      heightCm: req.heightCm,
      weightKg: req.weightKg,
      bloodType: req.bloodType,
      gender: req.gender,
      smokingStatus: req.smokingStatus,
      drinkingStatus: req.drinkingStatus,
    }
  }
}