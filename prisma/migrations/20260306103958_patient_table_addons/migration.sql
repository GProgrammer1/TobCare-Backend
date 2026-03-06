/*
  Warnings:

  - You are about to drop the column `diagnosed_at` on the `diseases` table. All the data in the column will be lost.
  - You are about to drop the column `emergency_contacts` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the `Medication` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `severity` to the `allergies` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SmokingStatus" AS ENUM ('NEVER', 'FORMER', 'CURRENT');

-- CreateEnum
CREATE TYPE "DrinkingStatus" AS ENUM ('NEVER', 'OCCASIONAL', 'REGULAR');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('MILD', 'MODERATE', 'SEVERE');

-- DropForeignKey
ALTER TABLE "Medication" DROP CONSTRAINT "Medication_allergy_id_fkey";

-- DropForeignKey
ALTER TABLE "Medication" DROP CONSTRAINT "Medication_disease_id_fkey";

-- DropForeignKey
ALTER TABLE "Medication" DROP CONSTRAINT "Medication_patient_id_fkey";

-- AlterTable
ALTER TABLE "allergies" DROP COLUMN "severity",
ADD COLUMN     "severity" "Severity" NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "diseases" DROP COLUMN "diagnosed_at",
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "patients" DROP COLUMN "emergency_contacts",
ADD COLUMN     "date_of_birth" DATE,
ADD COLUMN     "drinking_status" "DrinkingStatus",
ADD COLUMN     "height_cm" DOUBLE PRECISION,
ADD COLUMN     "smoking_status" "SmokingStatus",
ADD COLUMN     "weight_kg" DOUBLE PRECISION,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ;

-- DropTable
DROP TABLE "Medication";

-- CreateTable
CREATE TABLE "medications" (
    "id" BIGSERIAL NOT NULL,
    "patient_id" BIGINT,
    "name" TEXT NOT NULL,
    "dose" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "disease_id" BIGINT,
    "allergy_id" BIGINT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "prescribed_year" INTEGER,
    "prescribed_month" INTEGER,

    CONSTRAINT "medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_contacts" (
    "id" BIGSERIAL NOT NULL,
    "patient_id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "emergency_contacts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "medications" ADD CONSTRAINT "medications_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medications" ADD CONSTRAINT "medications_disease_id_fkey" FOREIGN KEY ("disease_id") REFERENCES "diseases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medications" ADD CONSTRAINT "medications_allergy_id_fkey" FOREIGN KEY ("allergy_id") REFERENCES "allergies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
