-- Create login_otps table for OTP-based authentication
CREATE TABLE IF NOT EXISTS "login_otps" (
    "id" BIGSERIAL PRIMARY KEY,
    "user_id" BIGINT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "otp_code" VARCHAR(6) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "login_otps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_login_otps_email" ON "login_otps"("email", "used", "expires_at");
CREATE INDEX IF NOT EXISTS "idx_login_otps_user_id" ON "login_otps"("user_id");

