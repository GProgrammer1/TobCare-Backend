import { BloodType, DrinkingStatus, Gender, Severity, SmokingStatus } from '@tobcare/prisma'
import { userSignupSchema, encryptedUserSignupSchema } from "common/dtos/auth.dto"
import z from 'zod'


// Patient signup
export const emergencyContactSchema = z.object({
    name: z.string().min(1),
    phoneNumber: z.coerce.bigint()
})

export const diseaseSchema = z.object({
    name: z.string().min(1),
    diagnosedYear: z.int().positive().lt(new Date().getFullYear()),
    diagnosedMonth: z.int().positive().gte(1).lte(12),
})

export const allergySchema = z.object({
    name: z.string().min(1),
    diagnosedYear: z.int().positive().lt(new Date().getFullYear()),
    diagnosedMonth: z.int().positive().gte(1).lte(12),
    severity: z.enum(Severity)
})

export const medicationSchema = z.object({
    name: z.string().min(1),
    dose: z.string().min(1),
    frequency: z.string().min(1),
    prescribedYear: z.int().positive().lt(new Date().getFullYear()),
    prescribedMonth: z.int().positive().gte(1).lte(12),
    allergy: allergySchema,
    disease: diseaseSchema
})
export const patientSignupSchema = userSignupSchema.extend({
  dateOfBirth: z.iso.date(),
  heightCm: z.float32(),
  weightKg: z.float32(),
  emergencyContacts: z.array(emergencyContactSchema).optional(),
  diseases: z.array(diseaseSchema).optional(),
  allergies: z.array(allergySchema).optional(),
  medications: z.array(medicationSchema).optional(),
  drinkingStatus: z.enum(DrinkingStatus).optional(),
  smokingStatus: z.enum(SmokingStatus).optional(),
  bloodType: z.enum(BloodType),
  gender: z.enum(Gender),
})


// Encrypted schemas: sensitive PII/PHI as hmac256 strings
const encryptedEmergencyContactSchema = z.object({
  name: z.string().min(1),
  phoneNumber: z.string().min(1),
})

const encryptedDiseaseSchema = z.object({
  name: z.string().min(1),
  diagnosedYear: z.number().int().positive(),
  diagnosedMonth: z.number().int().min(1).max(12),
})

const encryptedAllergySchema = z.object({
  name: z.string().min(1),
  diagnosedYear: z.number().int().positive(),
  diagnosedMonth: z.number().int().min(1).max(12),
  severity: z.enum(Severity),
})

const encryptedMedicationSchema = z.object({
  name: z.string().min(1),
  dose: z.string().min(1),
  frequency: z.string().min(1),
  prescribedYear: z.number().int().positive(),
  prescribedMonth: z.number().int().min(1).max(12),
  allergy: encryptedAllergySchema,
  disease: encryptedDiseaseSchema,
})

export const encryptedPatientSignupSchema = encryptedUserSignupSchema.extend({
  // Encrypted (sensitive PII/PHI)
  dateOfBirth: z.string().min(1),
  emergencyContacts: z.array(encryptedEmergencyContactSchema).optional(),
  diseases: z.array(encryptedDiseaseSchema).optional(),
  allergies: z.array(encryptedAllergySchema).optional(),
  medications: z.array(encryptedMedicationSchema).optional(),
  // Not encrypted (low sensitivity)
  heightCm: z.number(),
  weightKg: z.number(),
  bloodType: z.enum(BloodType),
  gender: z.enum(Gender),
  smokingStatus: z.enum(SmokingStatus).optional(),
  drinkingStatus: z.enum(DrinkingStatus).optional(),
})

export const otpVerificationSchema = z.object({
  otp: z.string().length(6).regex(/^\d+$/, "OTP must be 6 digits"),
  email: z.email().max(255),
})

export type OtpVerificationDto = z.infer<typeof otpVerificationSchema>
export type PatientSignupDto = z.infer<typeof patientSignupSchema>
export type EncryptedPatientSignupDto = z.infer<typeof encryptedPatientSignupSchema>

