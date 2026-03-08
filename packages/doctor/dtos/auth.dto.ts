import z from "zod"
import { Governorate } from "@tobcare/prisma"

const GovernorateValues = Object.values(Governorate) as [string, ...string[]]

export const clinicSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  governorate: z.enum(GovernorateValues),
  consultationFee: z.float32().positive().optional(),
})

// many file schemas using z.file()
export const hospitalSchema = z.object({
    name: z.string().min(1),
    address: z.string().min(1),
    governorate: z.enum(GovernorateValues),
})
export const doctorApplicationBaseSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.email(),
    phone: z.coerce.bigint(),
    dateOfBirth: z.iso.date(),
    nationalIdNumber: z.string().min(1),
    lopNumber: z.string().min(1),
    mophLicenseNumber: z.string().min(1),
    specialties: z.array(z.string()).min(1),
    isSpecialist: z.boolean(),
    graduationCountry: z.string().min(1),
    medicalSchool: z.string().min(1),
    graduationYear: z.number().int().positive(),
    clinics: z.array(clinicSchema).optional().default([]),
    hospitals: z.array(hospitalSchema).optional().default([]),
    acceptedInsurances: z.array(z.string()).optional().default([]),
    nationalIdDoc: z.file(),
    lopCertificateDoc: z.file(),
    medicalDegreeDoc: z.file(),
    mophLicenseDoc: z.file().optional(),
    specialtyDocs: z.array(z.file()),
    colloquiumDoc: z.file(),
    criminalRecordDoc: z.file(),
    passportPhotoDoc: z.file(),
})

const clinicOrHospitalRefinement = <T extends { clinics: unknown[]; hospitals: unknown[] }>(data: T) =>
    data.clinics.length > 0 || data.hospitals.length > 0

const clinicOrHospitalRefinementOptions = {
    message: "Doctor must work in at least one clinic or hospital",
    path: ["clinics", "hospitals"] as PropertyKey[],
}

export const doctorApplicationPayload = doctorApplicationBaseSchema
  .omit({
    nationalIdDoc: true,
    lopCertificateDoc: true,
    medicalDegreeDoc: true,
    mophLicenseDoc: true,
    specialtyDocs: true,
    colloquiumDoc: true,
    criminalRecordDoc: true,
    passportPhotoDoc: true,
  })
  .extend({
    nationalIdDoc: z.string().min(1),
    lopCertificateDoc: z.string().min(1),
    medicalDegreeDoc: z.string().min(1),
    mophLicenseDoc: z.string().min(1),
    specialtyDocs: z.array(z.string().min(1)).min(1),
    colloquiumDoc: z.string().min(1).optional(),
    criminalRecordDoc: z.string().min(1),
    passportPhotoDoc: z.string().min(1),
  })
  .refine(clinicOrHospitalRefinement, clinicOrHospitalRefinementOptions)

// Define after payload — .refine() in Zod v4 mutates the object schema,
// which would prevent .omit() from working if called afterwards.
export const doctorApplicationSchema = doctorApplicationBaseSchema
  .refine(clinicOrHospitalRefinement, clinicOrHospitalRefinementOptions)

export type DoctorApplicationPayload = z.infer<typeof doctorApplicationPayload>
export type DoctorApplicationDto = z.infer<typeof doctorApplicationSchema>
export type DoctorApplicationPayloadDto = z.infer<typeof doctorApplicationPayload>

export const setPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string()
    .regex(/[A-Z]/, { error: "Password should contain at least an uppercase letter" })
    .regex(/[a-z]/, { error: "Password should contain at least a lowercase letter" })
    .regex(/[0-9]/, { error: "Password should contain at least one digit" })
    .regex(/[^A-Za-z0-9]/, { error: "Password should contain at least one special character" })
    .min(8, { error: "Password minimum length is 8" }),
})

export type SetPasswordDto = z.infer<typeof setPasswordSchema>
