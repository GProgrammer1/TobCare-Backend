import { injectable, inject } from "tsyringe"
import { env } from "common/lib/env"
import { UserRepository } from "../repositories/user.repository"
import { EncryptedUserSignupDto, OtpRequestDto, OtpVerificationDto, UserSignupDto } from "common/dtos/auth.dto"
import { argon2Hash, generateOtp, hmac256 } from "common/utils/encryption"
import { BadRequestError, UserAlreadyExistsError } from "common/errors/errors"
import { RedisRepository } from "common/repositories/redis.repository"
import { emailSubjects } from "../constants/email-subjects"
import type { IMailService } from "../services/mail/mail.service"
import { TemplateRendererService } from "../services/template-renderer.service"

@injectable()
export class AuthService {
  constructor(
    @inject(UserRepository) private userRepository: UserRepository,
    @inject(RedisRepository) private redisRepository: RedisRepository,
    @inject("IMailService") private mailService: IMailService,
    @inject(TemplateRendererService) private templateRenderer: TemplateRendererService,
  ) {}

  async signupUser(userSignupReq: UserSignupDto) {
    const hashedEmail = hmac256(userSignupReq.email, env.HMAC_SECRET)
    const existingUser = await this.userRepository.findUserByEmail(hashedEmail)
    if (existingUser) {
      throw new UserAlreadyExistsError(userSignupReq.email)
    }
    const encryptedUserSignupReq = await this.encryptUserSignupReq(userSignupReq)
    return await this.userRepository.createUser(encryptedUserSignupReq)

  }

  async encryptUserSignupReq(userSignupReq: UserSignupDto): Promise<EncryptedUserSignupDto> {
    return {
        firstName: hmac256(userSignupReq.firstName, env.HMAC_SECRET),
        lastName: hmac256(userSignupReq.lastName, env.HMAC_SECRET),
        email: hmac256(userSignupReq.email, env.HMAC_SECRET),
        passwordHash: await argon2Hash(userSignupReq.password),
        role: userSignupReq.role,
        phoneNumber: hmac256(String(userSignupReq.phoneNumber), env.HMAC_SECRET),
    }
  }

  async verifyOtp(otpVerificationReq: OtpVerificationDto) { 
    const hashedEmail = hmac256(otpVerificationReq.email, env.HMAC_SECRET)
    const hashedOtp = hmac256(otpVerificationReq.otp, env.HMAC_SECRET)
    const storedOtp = await this.redisRepository.get(hashedEmail)
    if (!storedOtp) {
      throw new BadRequestError("Otp verification failed. Please request a new OTP.")
    }
    if (storedOtp !== hashedOtp) {
      throw new BadRequestError("Otp verification failed. Please request a new OTP.")
    }
    await this.redisRepository.del(hashedEmail)
    return { message: "OTP verified successfully" }
  }


  async sendOtp(otpRequestReq: OtpRequestDto) {
    const hashedEmail = hmac256(otpRequestReq.email, env.HMAC_SECRET)
    const existingUser = await this.userRepository.findUserByEmail(hashedEmail)
    const successMessage = {
      message:
        "If an account exists with this email, you will receive a verification code shortly.",
    }
    if (!existingUser) {
      return successMessage
    }
    const otp = generateOtp(6)
    const hashedOtp = hmac256(otp, env.HMAC_SECRET)
    await this.redisRepository.set(hashedEmail, hashedOtp, env.OTP_TTL_SECONDS)

    const template = this.templateRenderer.loadTemplate(
      "mails/otp-verification",
      "styles/otp-verification",
    )
    const html = this.templateRenderer.render(template, {
      firstName: existingUser.firstName,
      otp,
      otpDigits: Array.from(otp),
      otpTtlMinutes: Math.floor(env.OTP_TTL_SECONDS / 60),
      year: new Date().getFullYear(),
    })
    await this.mailService.sendMail({
      to: otpRequestReq.email,
      subject: emailSubjects.otpVerification,
      html,
    })
    return successMessage
  }
}