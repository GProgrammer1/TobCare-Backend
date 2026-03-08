-- AlterTable: change date_of_birth from DATE to VARCHAR(64) for HMAC-encrypted storage
ALTER TABLE "patients" ALTER COLUMN "date_of_birth" TYPE VARCHAR(64) USING "date_of_birth"::text;
