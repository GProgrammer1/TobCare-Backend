import bcrypt from 'bcrypt'
import type { PrismaClient } from '../generated/prisma/client.ts'
import { BLOODTYPE } from '../generated/prisma/enums.ts'
import { getMailService } from './mail/index.ts'
import { consumeOtp, generateOtp, storeOtp } from '../utils/otp.ts'
import { generateAccessToken, generateRefreshToken, type TokenPayload } from '../utils/jwt.ts'
import type { AuthResponse } from '../types/api.ts'
import type { RegisterPatientInput, LoginInput, VerifyLoginOtpInput } from '../validation/auth.ts'
import { BadRequestError, UnauthorizedError, NotFoundError } from '../utils/errors.ts'
import { encrypt, encryptDeterministic } from '../utils/encryption.ts'

const BCRYPT_ROUNDS = 10

const BLOOD_TYPE_MAP: Record<string, (typeof BLOODTYPE)[keyof typeof BLOODTYPE]> = {
  'A+': BLOODTYPE.A_pos,
  'A-': BLOODTYPE.A_neg,
  'B+': BLOODTYPE.B_pos,
  'B-': BLOODTYPE.B_neg,
  'O+': BLOODTYPE.O_pos,
  'O-': BLOODTYPE.O_neg,
  'AB+': BLOODTYPE.AB_pos,
  'AB-': BLOODTYPE.AB_neg,
}

export type RegisterPatientResult = {
  authResponse: AuthResponse
  refreshToken: string
}

export async function sendOtpToEmail(email: string): Promise<void> {
  const otp = generateOtp()
  storeOtp(email, otp)

  const mail = getMailService()
  await mail.send({
    to: email,
    subject: 'TobCare – Your verification code',
    template: 'otp',
    context: { otp },
  })
}

export async function registerPatient(prisma: PrismaClient, input: RegisterPatientInput): Promise<RegisterPatientResult> {
  if (!consumeOtp(input.email, input.otp)) {
    throw new Error('INVALID_OTP')
  }

  const patientRole = await prisma.userRole.findUnique({
    where: { role: 'PATIENT' },
  })
  if (!patientRole) {
    throw new Error('PATIENT_ROLE_NOT_FOUND')
  }

  const country = await prisma.country.findUnique({
    where: { id: BigInt(input.countryId) },
  })
  if (!country) {
    throw new Error('COUNTRY_NOT_FOUND')
  }

  const digitsOnly = input.phoneNumber.replace(/\D/g, '')
  const fullPhone = country.phoneCode + digitsOnly

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS)
  const bloodTypePrisma = BLOOD_TYPE_MAP[input.bloodType]
  if (!bloodTypePrisma) {
    throw new BadRequestError('Invalid blood type', 'INVALID_BLOOD_TYPE')
  }

  // Encrypt sensitive data
  const encryptedFirstName = encrypt(input.firstName)
  const encryptedLastName = encrypt(input.lastName)
  const encryptedPhone = encryptDeterministic(fullPhone)
  const encryptedAddress = encrypt(input.address)
  const encryptedDob = encrypt(input.dateOfBirth)

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        username: input.username,
        firstName: encryptedFirstName,
        lastName: encryptedLastName,
        email: input.email,
        passwordHash,
        phoneNumber: encryptedPhone,
        countryId: BigInt(input.countryId),
        roleId: patientRole.id,
      },
    })

    await tx.patient.create({
      data: {
        userId: newUser.id,
        dateOfBirth: encryptedDob,
        gender: input.gender,
        bloodType: bloodTypePrisma,
        address: encryptedAddress,
      },
    })

    return newUser
  })

  const payload: TokenPayload = {
    userId: user.id.toString(),
    role: patientRole.role,
  }

  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)

  return {
    authResponse: {
      userId: payload.userId,
      role: payload.role,
      accessToken,
    },
    refreshToken,
  }
}

export async function login(prisma: PrismaClient, input: LoginInput): Promise<{ message: string }> {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: input.identifier },
        { username: input.identifier },
      ],
    },
    include: { role: true },
  })

  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new UnauthorizedError('Invalid username/email or password', 'INVALID_CREDENTIALS')
  }

  // Send OTP
  await sendOtpToEmail(user.email)

  return { message: 'OTP_SENT' }
}

export async function verifyLoginOtp(prisma: PrismaClient, input: VerifyLoginOtpInput): Promise<RegisterPatientResult> {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: input.identifier },
        { username: input.identifier },
      ],
    },
    include: { role: true },
  })

  if (!user) {
    throw new NotFoundError('User not found', 'USER_NOT_FOUND')
  }

  if (!consumeOtp(user.email, input.otp)) {
    throw new BadRequestError('Invalid or expired verification code', 'INVALID_OTP')
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  const payload: TokenPayload = {
    userId: user.id.toString(),
    role: user.role.role,
  }

  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)

  return {
    authResponse: {
      userId: payload.userId,
      role: payload.role,
      accessToken,
    },
    refreshToken,
  }
}
