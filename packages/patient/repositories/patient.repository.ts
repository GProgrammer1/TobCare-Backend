import { PrismaClient } from "@tobcare/prisma";
import { UserRepository } from "common/repositories/user.repository";
import { inject, injectable } from "tsyringe";
import { EncryptedPatientSignupDto } from "../dtos/auth.dto";

@injectable()
export class PatientRepository {
    constructor(@inject("PrismaClient")
     private prismaClient: PrismaClient,
     @inject("UserRepository")
     private userRepository: UserRepository){}

     async createPatient(patientSignupPayload: EncryptedPatientSignupDto) {
        return await this.prismaClient.$transaction(async (tx) => {
            const user = await this.userRepository.createUserInTransaction(tx, patientSignupPayload)
            await tx.patient.create({
                data: {
                    userId: user.id,
                    dateOfBirth: patientSignupPayload.dateOfBirth,
                    heightCm: patientSignupPayload.heightCm,
                    weightKg: patientSignupPayload.weightKg,
                    bloodType: patientSignupPayload.bloodType,
                    gender: patientSignupPayload.gender,
                    ...(patientSignupPayload.smokingStatus != null && {
                      smokingStatus: patientSignupPayload.smokingStatus,
                    }),
                    ...(patientSignupPayload.drinkingStatus != null && {
                      drinkingStatus: patientSignupPayload.drinkingStatus,
                    }),
                    // populate emergency contacts table
                    ...(patientSignupPayload.emergencyContacts?.length && {
                      emergencyContacts: {
                        create: patientSignupPayload.emergencyContacts.map((contact) => ({
                          name: contact.name,
                          phoneNumber: contact.phoneNumber,
                        })),
                      },
                    }),
                    // populate diseases table
                    ...(patientSignupPayload.diseases?.length && {
                      diseases: {
                        create: patientSignupPayload.diseases.map((disease) => ({
                          name: disease.name,
                          diagnosedYear: disease.diagnosedYear,
                          diagnosedMonth: disease.diagnosedMonth,
                        })),
                      },
                    }),
                    // populate allergies table
                    ...(patientSignupPayload.allergies?.length && {
                      allergies: {
                        create: patientSignupPayload.allergies.map((allergy) => ({
                          name: allergy.name,
                          severity: allergy.severity,
                          diagnosedYear: allergy.diagnosedYear,
                          diagnosedMonth: allergy.diagnosedMonth,
                        })),
                      },
                    }),
                    // populate medications table (each medication has either allergy or disease)
                    ...(patientSignupPayload.medications?.length && {
                      medications: {
                        create: patientSignupPayload.medications.map((medication) => ({
                          name: medication.name,
                          dose: medication.dose,
                          frequency: medication.frequency,
                          prescribedYear: medication.prescribedYear,
                          prescribedMonth: medication.prescribedMonth,
                          ...(medication.allergy && {
                            allergy: { create: medication.allergy },
                          }),
                          ...(medication.disease && {
                            disease: { create: medication.disease },
                          }),
                        })),
                      },
                    }),
                }
            })
        })
     }
}