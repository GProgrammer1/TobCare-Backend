-- Add fullname column to patients table
ALTER TABLE "patients" ADD COLUMN "fullname" VARCHAR(255);

-- Add fullname column to doctors table
ALTER TABLE "doctors" ADD COLUMN "fullname" VARCHAR(255);

