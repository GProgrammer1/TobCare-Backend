/*
  Warnings:

  - Made the column `height_cm` on table `patients` required. This step will fail if there are existing NULL values in that column.
  - Made the column `weight_kg` on table `patients` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "patients" ALTER COLUMN "height_cm" SET NOT NULL,
ALTER COLUMN "weight_kg" SET NOT NULL;
