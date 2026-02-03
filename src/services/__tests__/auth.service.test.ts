import { sendOtpToEmail, registerPatient, login, verifyLoginOtp } from '../auth.service.ts'
import type { RegisterPatientInput } from '../../validation/auth.ts'
import type { PrismaClient } from '../../generated/prisma/client.ts'
import bcrypt from 'bcrypt'
import * as otp from '../../utils/otp.ts'
import * as jwt from '../../utils/jwt.ts'

const mockMailSend = jest.fn().mockResolvedValue(undefined)
jest.mock('../mail/index.ts', () => ({
  getMailService: () => ({ send: mockMailSend }),
}))
jest.mock('bcrypt')
jest.mock('../../utils/otp')
jest.mock('../../utils/jwt')
jest.mock('../../utils/encryption', () => ({
  encrypt: jest.fn((text) => `encrypted:${text}`),
  encryptDeterministic: jest.fn((text) => `deterministic:${text}`),
}))

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>
const mockOtp = otp as jest.Mocked<typeof otp>
const mockJwt = jwt as jest.Mocked<typeof jwt>

const validInput: RegisterPatientInput = {
  username: 'johndoe',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phoneNumber: '12345678',
  password: 'SecurePass1',
  confirmPassword: 'SecurePass1',
  gender: 'M',
  bloodType: 'A+',
  dateOfBirth: '1990-01-15',
  countryId: 1,
  address: '123 Main St',
  terms: true,
  otp: '123456',
}

function createMockPrisma(): jest.Mocked<PrismaClient> {
  const mockUser = {
    id: BigInt(100),
    username: validInput.username,
    firstName: validInput.firstName,
    lastName: validInput.lastName,
    email: validInput.email,
    passwordHash: 'hashed',
    phoneNumber: '+96112345678',
    countryId: BigInt(validInput.countryId),
    roleId: 1,
    createdAt: new Date(),
    lastLoginAt: new Date(),
  }
  const mockPatientRole = { id: 1, role: 'PATIENT' }
  const mockCountry = {
    id: BigInt(1),
    name: 'Lebanon',
    phoneCode: '+961',
    phoneNumberLength: 8,
  }

  const tx = {
    user: {
      create: jest.fn().mockResolvedValue(mockUser),
    },
    patient: {
      create: jest.fn().mockResolvedValue(undefined),
    },
  }

  return {
    userRole: {
      findUnique: jest.fn().mockResolvedValue(mockPatientRole),
    },
    country: {
      findUnique: jest.fn().mockResolvedValue(mockCountry),
    },
    $transaction: jest.fn((fn: (t: typeof tx) => Promise<unknown>) => fn(tx)),
  } as unknown as jest.Mocked<PrismaClient>
}

describe('auth service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockBcrypt.hash.mockResolvedValue('hashed-password' as never)
    mockOtp.consumeOtp.mockReturnValue(true)
    mockOtp.generateOtp.mockReturnValue('123456')
    mockOtp.storeOtp.mockImplementation(() => { })
    mockJwt.generateAccessToken.mockReturnValue('access-token')
    mockJwt.generateRefreshToken.mockReturnValue('refresh-token')
  })

  describe('sendOtpToEmail', () => {
    it('generates OTP, stores it, and sends email via mail service', async () => {
      await sendOtpToEmail('user@example.com')

      expect(mockOtp.generateOtp).toHaveBeenCalledTimes(1)
      expect(mockOtp.storeOtp).toHaveBeenCalledWith('user@example.com', '123456')
      expect(mockMailSend).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: 'TobCare – Your verification code',
        template: 'otp',
        context: { otp: '123456' },
      })
    })
  })

  describe('registerPatient', () => {
    it('returns authResponse and refreshToken when OTP and data are valid', async () => {
      const prisma = createMockPrisma()

      const result = await registerPatient(prisma, validInput)

      expect(mockOtp.consumeOtp).toHaveBeenCalledWith(validInput.email, validInput.otp)
      expect(prisma.userRole.findUnique).toHaveBeenCalledWith({ where: { role: 'PATIENT' } })
      expect(prisma.country.findUnique).toHaveBeenCalledWith({
        where: { id: BigInt(validInput.countryId) },
      })
      expect(mockBcrypt.hash).toHaveBeenCalledWith(validInput.password, 10)
      expect(prisma.$transaction).toHaveBeenCalled()
      expect(mockJwt.generateAccessToken).toHaveBeenCalledWith({
        userId: '100',
        role: 'PATIENT',
      })
      expect(mockJwt.generateRefreshToken).toHaveBeenCalledWith({
        userId: '100',
        role: 'PATIENT',
      })
      expect(result).toEqual({
        authResponse: {
          userId: '100',
          role: 'PATIENT',
          accessToken: 'access-token',
        },
        refreshToken: 'refresh-token',
      })
    })

    it('throws INVALID_OTP when consumeOtp returns false', async () => {
      mockOtp.consumeOtp.mockReturnValue(false)
      const prisma = createMockPrisma()

      await expect(registerPatient(prisma, validInput)).rejects.toThrow('INVALID_OTP')
      expect(prisma.userRole.findUnique).not.toHaveBeenCalled()
    })

    it('throws PATIENT_ROLE_NOT_FOUND when role does not exist', async () => {
      const prisma = createMockPrisma()
        ; (prisma.userRole.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(registerPatient(prisma, validInput)).rejects.toThrow(
        'PATIENT_ROLE_NOT_FOUND'
      )
      expect(prisma.country.findUnique).not.toHaveBeenCalled()
    })

    it('throws COUNTRY_NOT_FOUND when country does not exist', async () => {
      const prisma = createMockPrisma()
        ; (prisma.country.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(registerPatient(prisma, validInput)).rejects.toThrow('COUNTRY_NOT_FOUND')
    })

    it('builds full phone number from country code and digits', async () => {
      const prisma = createMockPrisma()
      await registerPatient(prisma, { ...validInput, phoneNumber: '12 34 56 78' })

      const txCallback = (prisma.$transaction as jest.Mock).mock.calls[0]?.[0]
      expect(txCallback).toBeDefined()
      const mockUserCreate = jest.fn().mockResolvedValue({ id: BigInt(100) })
      const mockPatientCreate = jest.fn().mockResolvedValue(undefined)
      await txCallback({
        user: { create: mockUserCreate },
        patient: { create: mockPatientCreate },
      })
      expect(mockUserCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            phoneNumber: 'deterministic:+96112345678',
          }),
        })
      )
    })
  })

  describe('login', () => {
    const loginInput = { identifier: 'johndoe', password: 'SecurePass1' }
    const mockUser = {
      id: BigInt(100),
      username: 'johndoe',
      email: 'john@example.com',
      passwordHash: 'hashed-password',
      role: { role: 'PATIENT' }
    }

    it('sends OTP and returns message when credentials are valid', async () => {
      const prisma = {
        user: { findFirst: jest.fn().mockResolvedValue(mockUser) }
      } as unknown as jest.Mocked<PrismaClient>

      mockBcrypt.compare.mockResolvedValue(true as never)

      const result = await login(prisma, loginInput)

      expect(prisma.user.findFirst).toHaveBeenCalled()
      expect(mockBcrypt.compare).toHaveBeenCalledWith(loginInput.password, mockUser.passwordHash)
      expect(mockOtp.generateOtp).toHaveBeenCalled()
      expect(result).toEqual({ message: 'OTP_SENT' })
    })

    it('throws INVALID_CREDENTIALS when user is not found', async () => {
      const prisma = {
        user: { findFirst: jest.fn().mockResolvedValue(null) }
      } as unknown as jest.Mocked<PrismaClient>

      await expect(login(prisma, loginInput)).rejects.toThrow('Invalid username/email or password')
    })

    it('throws INVALID_CREDENTIALS when password does not match', async () => {
      const prisma = {
        user: { findFirst: jest.fn().mockResolvedValue(mockUser) }
      } as unknown as jest.Mocked<PrismaClient>

      mockBcrypt.compare.mockResolvedValue(false as never)

      await expect(login(prisma, loginInput)).rejects.toThrow('Invalid username/email or password')
    })
  })

  describe('verifyLoginOtp', () => {
    const verifyInput = { identifier: 'johndoe', otp: '123456' }
    const mockUser = {
      id: BigInt(100),
      username: 'johndoe',
      email: 'john@example.com',
      role: { role: 'PATIENT' }
    }

    it('returns tokens and updates lastLoginAt when OTP is valid', async () => {
      const prisma = {
        user: {
          findFirst: jest.fn().mockResolvedValue(mockUser),
          update: jest.fn().mockResolvedValue(mockUser)
        }
      } as unknown as jest.Mocked<PrismaClient>

      const result = await verifyLoginOtp(prisma, verifyInput)

      expect(prisma.user.findFirst).toHaveBeenCalled()
      expect(mockOtp.consumeOtp).toHaveBeenCalledWith(mockUser.email, verifyInput.otp)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { lastLoginAt: expect.any(Date) }
      })
      expect(result.authResponse.userId).toBe('100')
      expect(result.refreshToken).toBe('refresh-token')
    })

    it('throws USER_NOT_FOUND when user is not found', async () => {
      const prisma = {
        user: { findFirst: jest.fn().mockResolvedValue(null) }
      } as unknown as jest.Mocked<PrismaClient>

      await expect(verifyLoginOtp(prisma, verifyInput)).rejects.toThrow('User not found')
    })

    it('throws INVALID_OTP when OTP is invalid', async () => {
      const prisma = {
        user: { findFirst: jest.fn().mockResolvedValue(mockUser) }
      } as unknown as jest.Mocked<PrismaClient>

      mockOtp.consumeOtp.mockReturnValue(false)

      await expect(verifyLoginOtp(prisma, verifyInput)).rejects.toThrow('Invalid or expired verification code')
    })
  })
})
