import { injectable, inject } from "tsyringe"
import { env } from "common/lib/env"
import { UserRepository } from "../repositories/user.repository"
import { EncryptedUserSignupDto, LoginDto, OtpRequestDto, OtpVerificationDto, UserSignupDto } from "common/dtos/auth.dto"
import { argon2Hash, argon2Verify, generateAccessToken, generateOtp, generateRefreshToken, hmac256, verifyToken } from "common/utils/encryption"
import { BadRequestError, UnauthorizedError, UserAlreadyExistsError } from "common/errors/errors"
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
      throw new UserAlreadyExistsError()
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
    const successMessage = {
      message:
        "If an account exists with this email, you will receive a verification code shortly.",
    }
    
    const otp = generateOtp(6)
    const hashedOtp = hmac256(otp, env.HMAC_SECRET)
    await this.redisRepository.set(hashedEmail, hashedOtp, env.OTP_TTL_SECONDS)

    const template = this.templateRenderer.loadTemplate(
      "mails/otp-verification",
      "styles/otp-verification",
    )
    const html = this.templateRenderer.render(template, {
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

  async login(loginDto: LoginDto) {
    const hashedEmail = hmac256(loginDto.email, env.HMAC_SECRET)
    const user = await this.userRepository.findUserByEmail(hashedEmail)
    if (!user) {
      throw new UnauthorizedError("Invalid email or password")
    }

    const passwordValid = await argon2Verify(user.passwordHash, loginDto.password)
    if (!passwordValid) {
      throw new UnauthorizedError("Invalid email or password")
    }

    const tokenPayload = { sub: String(user.id), role: user.role }

    const accessToken = generateAccessToken(
      tokenPayload,
      env.JWT_SECRET,
      env.JWT_ACCESS_EXPIRY_SECONDS,
    )
    const refreshToken = generateRefreshToken(
      tokenPayload,
      env.JWT_SECRET,
      env.JWT_REFRESH_EXPIRY_SECONDS,
    )

    // Store refresh token in Redis
    const refreshKey = `refresh:${user.id}`
    await this.redisRepository.set(refreshKey, refreshToken, env.JWT_REFRESH_EXPIRY_SECONDS)

    return { accessToken, refreshToken, role: user.role }
  }

  async logout(userId: string) {
    await this.redisRepository.del(`refresh:${userId}`)
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; role: string }
    try {
      payload = verifyToken(refreshToken, env.JWT_SECRET) as { sub: string; role: string }
    } catch {
      throw new UnauthorizedError("Invalid or expired refresh token")
    }

    // Check that the refresh token still exists in Redis
    const storedToken = await this.redisRepository.get(`refresh:${payload.sub}`)
    if (!storedToken || storedToken !== refreshToken) {
      throw new UnauthorizedError("Invalid or expired refresh token")
    }

    const newAccessToken = generateAccessToken(
      { sub: payload.sub, role: payload.role },
      env.JWT_SECRET,
      env.JWT_ACCESS_EXPIRY_SECONDS,
    )

    return { accessToken: newAccessToken, role: payload.role }
  }

  async getMe(userId: string, role: string) {
    return { userId, role }
  }
}