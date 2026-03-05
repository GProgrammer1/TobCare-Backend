-- Enable the citext extension (PostgreSQL)
CREATE EXTENSION IF NOT EXISTS citext;

-- AlterTable: change email column from VARCHAR to CITEXT for case-insensitive comparison
ALTER TABLE "User" ALTER COLUMN "email" TYPE citext USING "email"::citext;
