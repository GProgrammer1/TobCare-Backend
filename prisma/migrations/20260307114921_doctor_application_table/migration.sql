/*
  Warnings:

  - The primary key for the `clinics` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `clinics` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `hospitals` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `hospitals` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `DoctorApplication` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `doctor_application_id` on the `clinics` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `governorate` to the `hospitals` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `doctor_application_id` on the `hospitals` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterEnum
ALTER TYPE "ApplicationStatus" ADD VALUE 'SUSPENDED';

-- DropForeignKey
ALTER TABLE "clinics" DROP CONSTRAINT "clinics_doctor_application_id_fkey";

-- DropForeignKey
ALTER TABLE "hospitals" DROP CONSTRAINT "hospitals_doctor_application_id_fkey";

-- AlterTable
ALTER TABLE "clinics" DROP CONSTRAINT "clinics_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" BIGSERIAL NOT NULL,
DROP COLUMN "doctor_application_id",
ADD COLUMN     "doctor_application_id" BIGINT NOT NULL,
ADD CONSTRAINT "clinics_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "hospitals" DROP CONSTRAINT "hospitals_pkey",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "governorate" "Governorate" NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" BIGSERIAL NOT NULL,
DROP COLUMN "doctor_application_id",
ADD COLUMN     "doctor_application_id" BIGINT NOT NULL,
ADD CONSTRAINT "hospitals_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "DoctorApplication";

-- CreateTable
CREATE TABLE "doctor_applications" (
    "id" BIGSERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "nationalIdNumber" TEXT NOT NULL,
    "lopNumber" TEXT NOT NULL,
    "mophLicenseNumber" TEXT NOT NULL,
    "specialties" TEXT[],
    "isSpecialist" BOOLEAN NOT NULL DEFAULT false,
    "graduationCountry" TEXT NOT NULL,
    "medicalSchool" TEXT NOT NULL,
    "graduationYear" INTEGER NOT NULL,
    "accepted_insurances" TEXT[],
    "national_id_doc" TEXT NOT NULL,
    "lop_certificate_doc" TEXT NOT NULL,
    "medical_degree_doc" TEXT NOT NULL,
    "moph_license_doc" TEXT NOT NULL,
    "specialty_docs" TEXT[],
    "colloquium_doc" TEXT,
    "criminal_record_doc" TEXT,
    "passport_photo_doc" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMPTZ,
    "verified_by" BIGINT,
    "admin_notes" TEXT,

    CONSTRAINT "doctor_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "doctor_applications_email_key" ON "doctor_applications"("email");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_applications_nationalIdNumber_key" ON "doctor_applications"("nationalIdNumber");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_applications_lopNumber_key" ON "doctor_applications"("lopNumber");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_applications_mophLicenseNumber_key" ON "doctor_applications"("mophLicenseNumber");

-- AddForeignKey
ALTER TABLE "hospitals" ADD CONSTRAINT "hospitals_doctor_application_id_fkey" FOREIGN KEY ("doctor_application_id") REFERENCES "doctor_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinics" ADD CONSTRAINT "clinics_doctor_application_id_fkey" FOREIGN KEY ("doctor_application_id") REFERENCES "doctor_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
