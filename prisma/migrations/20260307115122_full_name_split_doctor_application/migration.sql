/*
  Warnings:

  - You are about to drop the column `fullName` on the `doctor_applications` table. All the data in the column will be lost.
  - Added the required column `first_name` to the `doctor_applications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_name` to the `doctor_applications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "doctor_applications" DROP COLUMN "fullName",
ADD COLUMN     "first_name" TEXT NOT NULL,
ADD COLUMN     "last_name" TEXT NOT NULL;
