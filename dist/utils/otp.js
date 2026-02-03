/**
 * OTP utilities – generate, store, verify.
 * Storage is in-memory (dev); replace with Redis/DB for production.
 */
const OTP_LENGTH = 6;
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const otpStore = new Map();
function randomDigits(length) {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += Math.floor(Math.random() * 10).toString();
    }
    return result;
}
export function generateOtp() {
    return randomDigits(OTP_LENGTH);
}
export function storeOtp(email, otp) {
    otpStore.set(email.toLowerCase(), {
        otp,
        expiresAt: Date.now() + OTP_TTL_MS,
    });
}
export function verifyOtp(email, otp) {
    const entry = otpStore.get(email.toLowerCase());
    if (!entry)
        return false;
    if (Date.now() > entry.expiresAt) {
        otpStore.delete(email.toLowerCase());
        return false;
    }
    return entry.otp === otp;
}
export function consumeOtp(email, otp) {
    if (!verifyOtp(email, otp))
        return false;
    otpStore.delete(email.toLowerCase());
    return true;
}
