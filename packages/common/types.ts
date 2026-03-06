
export interface OtpEmailContext {
  /** CSS styles injected into the <style> tag via {{{styles}}} */
  styles: string
  /** User's first name for the greeting */
  firstName: string
  /** Full OTP string (used in hidden preheader text) */
  otp: string
  /** Individual OTP digits array for rendering spaced digit cells */
  otpDigits: string[]
  /** OTP expiry time in minutes */
  otpTtlMinutes: number
  /** Current year for footer copyright */
  year: number
}
