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
      throw new UserAlreadyExistsError(patientSignupRequest.email)
    }
    const encrypted = await this.encryptPatientSignupRequest(patientSignupRequest)
    return await this.patientRepository.createPatient(encrypted)
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
        allergy: {
          name: hmac256(m.allergy.name, secret),
          diagnosedYear: m.allergy.diagnosedYear,
          diagnosedMonth: m.allergy.diagnosedMonth,
          severity: m.allergy.severity,
        },
        disease: {
          name: hmac256(m.disease.name, secret),
          diagnosedYear: m.disease.diagnosedYear,
          diagnosedMonth: m.disease.diagnosedMonth,
        },
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