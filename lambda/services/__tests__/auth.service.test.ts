import { loginPatient, LoginInput } from '../auth.service';
import { PrismaClient } from '../../../lib/generated/prisma';
import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import * as otpService from '../otp.service';

jest.mock('argon2');
jest.mock('jsonwebtoken');
jest.mock('../otp.service');

describe('Auth Service', () => {
    let mockPrisma: jest.Mocked<PrismaClient>;
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
        originalEnv = process.env;
        process.env.JWT_SECRET = 'test-jwt-secret-key';

        mockPrisma = {
            users: {
                findUnique: jest.fn(),
                update: jest.fn(),
            },
        } as any;

        jest.spyOn(argon2, 'verify').mockResolvedValue(true);
        (jwt.sign as jest.Mock) = jest.fn().mockReturnValue('token');
    });

    afterEach(() => {
        process.env = originalEnv;
        jest.clearAllMocks();
    });

    describe('loginPatient', () => {
        const validInput: LoginInput = {
            email: 'test@example.com',
            password: 'password123',
            otp: '123456'
        };

        const mockUser = {
            id: BigInt(1),
            email: 'test@example.com',
            password_hash: 'hashed_password',
            role_id: 1,
            roles: {
                id: 1,
                name: 'patient'
            }
        };

        it('should successfully login patient with valid credentials and OTP', async () => {
            (mockPrisma.users.findUnique as jest.Mock).mockResolvedValue(mockUser);
            jest.spyOn(argon2, 'verify').mockResolvedValue(true);
            jest.spyOn(otpService, 'verifyOtp').mockResolvedValue({ valid: true, userId: BigInt(1) });
            (jwt.sign as jest.Mock)
                .mockReturnValueOnce('mock-access-token')
                .mockReturnValueOnce('mock-refresh-token');
            (mockPrisma.users.update as jest.Mock).mockResolvedValue(mockUser);

            const result = await loginPatient(mockPrisma, validInput);

            expect(result.loginResult).toEqual({
                userid: '1',
                role: 'patient',
                accessToken: 'mock-access-token'
            });
            expect(result.refreshToken).toBe('mock-refresh-token');
            expect(mockPrisma.users.findUnique).toHaveBeenCalledWith({
                where: { email: 'test@example.com' },
                include: { roles: true }
            });
            expect(argon2.verify).toHaveBeenCalledWith('hashed_password', 'password123');
            expect(otpService.verifyOtp).toHaveBeenCalledWith(mockPrisma, 'test@example.com', '123456');
            expect(jwt.sign).toHaveBeenCalledTimes(2);
            expect(mockPrisma.users.update).toHaveBeenCalledWith({
                where: { id: BigInt(1) },
                data: { last_login_at: expect.any(Date) }
            });
        });

        it('should throw error if user not found', async () => {
            (mockPrisma.users.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(loginPatient(mockPrisma, validInput)).rejects.toThrow('Invalid email, password, or OTP');
            expect(mockPrisma.users.findUnique).toHaveBeenCalledWith({
                where: { email: 'test@example.com' },
                include: { roles: true }
            });
            expect(argon2.verify).not.toHaveBeenCalled();
            expect(otpService.verifyOtp).not.toHaveBeenCalled();
            expect(jwt.sign).not.toHaveBeenCalled();
        });

        it('should throw error if password is invalid', async () => {
            (mockPrisma.users.findUnique as jest.Mock).mockResolvedValue(mockUser);
            jest.spyOn(argon2, 'verify').mockResolvedValue(false);

            await expect(loginPatient(mockPrisma, validInput)).rejects.toThrow('Invalid email, password, or OTP');
            expect(argon2.verify).toHaveBeenCalledWith('hashed_password', 'password123');
            expect(otpService.verifyOtp).not.toHaveBeenCalled();
            expect(jwt.sign).not.toHaveBeenCalled();
            expect(mockPrisma.users.update).not.toHaveBeenCalled();
        });

        it('should throw error if OTP is invalid', async () => {
            (mockPrisma.users.findUnique as jest.Mock).mockResolvedValue(mockUser);
            jest.spyOn(argon2, 'verify').mockResolvedValue(true);
            jest.spyOn(otpService, 'verifyOtp').mockResolvedValue({ valid: false });

            await expect(loginPatient(mockPrisma, validInput)).rejects.toThrow('Invalid email, password, or OTP');
            expect(argon2.verify).toHaveBeenCalledWith('hashed_password', 'password123');
            expect(otpService.verifyOtp).toHaveBeenCalledWith(mockPrisma, 'test@example.com', '123456');
            expect(jwt.sign).not.toHaveBeenCalled();
            expect(mockPrisma.users.update).not.toHaveBeenCalled();
        });

        it('should throw error if OTP userId does not match user id', async () => {
            (mockPrisma.users.findUnique as jest.Mock).mockResolvedValue(mockUser);
            jest.spyOn(argon2, 'verify').mockResolvedValue(true);
            jest.spyOn(otpService, 'verifyOtp').mockResolvedValue({ valid: true, userId: BigInt(2) }); // Different user ID

            await expect(loginPatient(mockPrisma, validInput)).rejects.toThrow('Invalid email, password, or OTP');
            expect(argon2.verify).toHaveBeenCalledWith('hashed_password', 'password123');
            expect(otpService.verifyOtp).toHaveBeenCalledWith(mockPrisma, 'test@example.com', '123456');
            expect(jwt.sign).not.toHaveBeenCalled();
            expect(mockPrisma.users.update).not.toHaveBeenCalled();
        });

        it('should generate access token with correct payload and expiration', async () => {
            (mockPrisma.users.findUnique as jest.Mock).mockResolvedValue(mockUser);
            jest.spyOn(argon2, 'verify').mockResolvedValue(true);
            jest.spyOn(otpService, 'verifyOtp').mockResolvedValue({ valid: true, userId: BigInt(1) });
            (jwt.sign as jest.Mock)
                .mockReturnValueOnce('access-token')
                .mockReturnValueOnce('refresh-token');
            (mockPrisma.users.update as jest.Mock).mockResolvedValue(mockUser);

            await loginPatient(mockPrisma, validInput);

            expect(jwt.sign).toHaveBeenNthCalledWith(
                1,
                {
                    userId: '1',
                    roleId: 1,
                    role: 'patient',
                    type: 'access'
                },
                'test-jwt-secret-key',
                { expiresIn: '15m' }
            );
        });

        it('should generate refresh token with correct payload and expiration', async () => {
            (mockPrisma.users.findUnique as jest.Mock).mockResolvedValue(mockUser);
            jest.spyOn(argon2, 'verify').mockResolvedValue(true);
            jest.spyOn(otpService, 'verifyOtp').mockResolvedValue({ valid: true, userId: BigInt(1) });
            (jwt.sign as jest.Mock)
                .mockReturnValueOnce('access-token')
                .mockReturnValueOnce('refresh-token');
            (mockPrisma.users.update as jest.Mock).mockResolvedValue(mockUser);

            await loginPatient(mockPrisma, validInput);

            expect(jwt.sign).toHaveBeenNthCalledWith(
                2,
                {
                    userId: '1',
                    roleId: 1,
                    role: 'patient',
                    type: 'refresh'
                },
                'test-jwt-secret-key',
                { expiresIn: '7d' }
            );
        });

        it('should throw error if JWT_SECRET is not set', async () => {
            delete process.env.JWT_SECRET;
            (mockPrisma.users.findUnique as jest.Mock).mockResolvedValue(mockUser);
            jest.spyOn(argon2, 'verify').mockResolvedValue(true);
            jest.spyOn(otpService, 'verifyOtp').mockResolvedValue({ valid: true, userId: BigInt(1) });

            await expect(loginPatient(mockPrisma, validInput)).rejects.toThrow('JWT_SECRET environment variable is not set');
        });

        it('should update last_login_at timestamp on successful login', async () => {
            (mockPrisma.users.findUnique as jest.Mock).mockResolvedValue(mockUser);
            jest.spyOn(argon2, 'verify').mockResolvedValue(true);
            jest.spyOn(otpService, 'verifyOtp').mockResolvedValue({ valid: true, userId: BigInt(1) });
            (jwt.sign as jest.Mock)
                .mockReturnValueOnce('access-token')
                .mockReturnValueOnce('refresh-token');
            (mockPrisma.users.update as jest.Mock).mockResolvedValue(mockUser);

            await loginPatient(mockPrisma, validInput);

            expect(mockPrisma.users.update).toHaveBeenCalled();
            const updateCall = (mockPrisma.users.update as jest.Mock).mock.calls[0][0];
            expect(updateCall.where).toEqual({ id: BigInt(1) });
            expect(updateCall.data.last_login_at).toBeInstanceOf(Date);
        });
    });
});

