-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Governorate" AS ENUM ('BEIRUT', 'MOUNT_LEBANON', 'NORTH', 'SOUTH', 'BEKAA', 'NABATIEH', 'AKKAR', 'BAALBEK_HERMEL');

-- CreateTable
CREATE TABLE "hospitals" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "doctor_application_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "hospitals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinics" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "governorate" "Governorate" NOT NULL,
    "consultation_fee" DECIMAL(65,30),
    "doctor_application_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "clinics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorApplication" (
    "id" TEXT NOT NULL,
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
    "nationalIdDoc" TEXT,
    "lopCertificateDoc" TEXT,
    "medicalDegreeDoc" TEXT,
    "mophLicenseDoc" TEXT,
    "specialtyDocsDoc" TEXT[],
    "colloquiumDoc" TEXT,
    "policeRecordDoc" TEXT,
    "passportPhotoDoc" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMPTZ,
    "verified_by" BIGINT,

    CONSTRAINT "DoctorApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DoctorApplication_email_key" ON "DoctorApplication"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorApplication_nationalIdNumber_key" ON "DoctorApplication"("nationalIdNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorApplication_lopNumber_key" ON "DoctorApplication"("lopNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorApplication_mophLicenseNumber_key" ON "DoctorApplication"("mophLicenseNumber");

-- AddForeignKey
ALTER TABLE "hospitals" ADD CONSTRAINT "hospitals_doctor_application_id_fkey" FOREIGN KEY ("doctor_application_id") REFERENCES "DoctorApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinics" ADD CONSTRAINT "clinics_doctor_application_id_fkey" FOREIGN KEY ("doctor_application_id") REFERENCES "DoctorApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
