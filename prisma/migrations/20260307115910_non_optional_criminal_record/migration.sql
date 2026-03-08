/*
  Warnings:

  - Made the column `criminal_record_doc` on table `doctor_applications` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "doctor_applications" ALTER COLUMN "criminal_record_doc" SET NOT NULL;
