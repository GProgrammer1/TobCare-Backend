import { inject, injectable } from "tsyringe"
import type { Governorate, PrismaClient } from "@tobcare/prisma"
import type { DoctorApplicationPayload } from "../dtos/auth.dto"

@injectable()
export class DoctorApplicationRepository {
  constructor(
    @inject("PrismaClient") private prisma: PrismaClient,
  ) {}

  async findById(id: bigint) {
    return this.prisma.doctorApplication.findUnique({ where: { id } })
  }

  async create(dto: DoctorApplicationPayload) {
    const { clinics, hospitals, ...rest } = dto
    return this.prisma.doctorApplication.create({
      data: {
        firstName: rest.firstName,
        lastName: rest.lastName,
        email: rest.email,
        phone: String(rest.phone),
        dateOfBirth: new Date(rest.dateOfBirth),
        nationalIdNumber: rest.nationalIdNumber,
        lopNumber: rest.lopNumber,
        mophLicenseNumber: rest.mophLicenseNumber,
        specialties: rest.specialties,
        isSpecialist: rest.isSpecialist,
        graduationCountry: rest.graduationCountry,
        medicalSchool: rest.medicalSchool,
        graduationYear: rest.graduationYear,
        acceptedInsurances: rest.acceptedInsurances ?? [],
        nationalIdDoc: rest.nationalIdDoc,
        lopCertificateDoc: rest.lopCertificateDoc,
        medicalDegreeDoc: rest.medicalDegreeDoc,
        mophLicenseDoc: rest.mophLicenseDoc,
        specialtyDocs: rest.specialtyDocs,
        colloquiumDoc: rest.colloquiumDoc ?? null,
        criminalRecordDoc: rest.criminalRecordDoc ?? null,
        passportPhotoDoc: rest.passportPhotoDoc,
        ...(clinics?.length
          ? { clinics: { create: clinics.map((c) => ({ name: c.name, address: c.address ?? null, governorate: c.governorate as Governorate, consultationFee: c.consultationFee ?? null })) } }
          : {}),
        ...(hospitals?.length
          ? { hospitals: { create: hospitals.map((h) => ({ name: h.name, address: h.address ?? null, governorate: h.governorate as Governorate })) } }
          : {}),
      },
    })
  }
}
