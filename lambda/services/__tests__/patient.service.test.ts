import { registerPatient, PatientSignupInput } from '../patient.service';
import { PrismaClient } from '../../../lib/generated/prisma';
import * as argon2 from 'argon2';

// Mock dependencies
jest.mock('argon2');
jest.mock('../../common/encryption', () => ({
    encrypt: jest.fn((text: string) => `encrypted_${text}`)
}));

describe('Patient Service', () => {
    let mockPrisma: jest.Mocked<PrismaClient>;
    let mockTransaction: jest.Mock;

    beforeEach(() => {
        mockTransaction = jest.fn();
        mockPrisma = {
            roles: {
                findUnique: jest.fn(),
            },
            $transaction: jest.fn((callback) => callback({
                users: { create: jest.fn() },
                countries: { findFirst: jest.fn(), create: jest.fn() },
                genders: { findUnique: jest.fn(), create: jest.fn() },
                blood_types: { findUnique: jest.fn(), create: jest.fn() },
                patients: { create: jest.fn() },
            })) as any,
        } as any;

        (argon2.hash as jest.Mock) = jest.fn().mockResolvedValue('hashed_password');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('registerPatient', () => {
        const validInput: PatientSignupInput = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
            gender: 'M',
            blood_type: 'O+',
            phone_number: '+1234567890',
            country: 'Lebanon'
        };

        it('should throw error if patient role not found', async () => {
            (mockPrisma.roles.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(registerPatient(mockPrisma, validInput)).rejects.toThrow('Patient role not found');
        });

        it('should create patient with existing country', async () => {
            const mockPatientRole = { id: 1, name: 'patient' };
            const mockUser = { id: BigInt(1), username: 'testuser', email: 'test@example.com' };
            const mockCountry = { id: BigInt(126), name: 'Lebanon', phone_code: '961' };
            const mockGender = { id: 1, code: 'M' };
            const mockBloodType = { id: 1, code: 'O+' };
            const mockPatient = {
                id: BigInt(1),
                user_id: BigInt(1),
                gender_id: 1,
                blood_type_id: 1,
                phone_number: 'encrypted_+1234567890',
                country_id: BigInt(126)
            };

            (mockPrisma.roles.findUnique as jest.Mock).mockResolvedValue(mockPatientRole);

            let txMock: any;
            mockPrisma.$transaction = jest.fn(async (callback) => {
                txMock = {
                    users: {
                        create: jest.fn().mockResolvedValue(mockUser)
                    },
                    countries: {
                        findFirst: jest.fn().mockResolvedValue(mockCountry),
                        create: jest.fn()
                    },
                    genders: {
                        findUnique: jest.fn().mockResolvedValue(mockGender),
                        create: jest.fn()
                    },
                    blood_types: {
                        findUnique: jest.fn().mockResolvedValue(mockBloodType),
                        create: jest.fn()
                    },
                    patients: {
                        create: jest.fn().mockResolvedValue(mockPatient)
                    }
                };
                return callback(txMock);
            }) as any;

            const result = await registerPatient(mockPrisma, validInput);

            expect(result).toEqual(mockPatient);
            expect(mockPrisma.roles.findUnique).toHaveBeenCalledWith({ where: { name: 'patient' } });
            expect(txMock.countries.findFirst).toHaveBeenCalledWith({
                where: { name: { equals: 'Lebanon', mode: 'insensitive' } }
            });
            expect(txMock.countries.create).not.toHaveBeenCalled();
            expect(txMock.users.create).toHaveBeenCalled();
            expect(txMock.patients.create).toHaveBeenCalled();
        });

        it('should create country if not found', async () => {
            const mockPatientRole = { id: 1, name: 'patient' };
            const mockUser = { id: BigInt(1), username: 'testuser', email: 'test@example.com' };
            const mockCountry = { id: BigInt(999), name: 'Testland', phone_code: '000' };
            const mockGender = { id: 1, code: 'M' };
            const mockPatient = {
                id: BigInt(1),
                user_id: BigInt(1),
                gender_id: 1,
                blood_type_id: null,
                phone_number: 'encrypted_+1234567890',
                country_id: BigInt(999)
            };

            (mockPrisma.roles.findUnique as jest.Mock).mockResolvedValue(mockPatientRole);

            let txMock: any;
            mockPrisma.$transaction = jest.fn(async (callback) => {
                txMock = {
                    users: {
                        create: jest.fn().mockResolvedValue(mockUser)
                    },
                    countries: {
                        findFirst: jest.fn().mockResolvedValue(null),
                        create: jest.fn().mockResolvedValue(mockCountry)
                    },
                    genders: {
                        findUnique: jest.fn().mockResolvedValue(mockGender),
                        create: jest.fn()
                    },
                    blood_types: {
                        findUnique: jest.fn(),
                        create: jest.fn()
                    },
                    patients: {
                        create: jest.fn().mockResolvedValue(mockPatient)
                    }
                };
                return callback(txMock);
            }) as any;

            const inputWithoutBloodType = { ...validInput, country: 'Testland', blood_type: undefined };
            const result = await registerPatient(mockPrisma, inputWithoutBloodType);

            expect(result).toEqual(mockPatient);
            expect(txMock.countries.findFirst).toHaveBeenCalled();
            expect(txMock.countries.create).toHaveBeenCalledWith({
                data: { name: 'Testland', phone_code: '000' }
            });
        });

        it('should create gender if not found', async () => {
            const mockPatientRole = { id: 1, name: 'patient' };
            const mockUser = { id: BigInt(1), username: 'testuser', email: 'test@example.com' };
            const mockCountry = { id: BigInt(126), name: 'Lebanon', phone_code: '961' };
            const mockGender = { id: 2, code: 'F' };
            const mockPatient = {
                id: BigInt(1),
                user_id: BigInt(1),
                gender_id: 2,
                blood_type_id: null,
                phone_number: 'encrypted_+1234567890',
                country_id: BigInt(126)
            };

            (mockPrisma.roles.findUnique as jest.Mock).mockResolvedValue(mockPatientRole);

            let txMock: any;
            mockPrisma.$transaction = jest.fn(async (callback) => {
                txMock = {
                    users: {
                        create: jest.fn().mockResolvedValue(mockUser)
                    },
                    countries: {
                        findFirst: jest.fn().mockResolvedValue(mockCountry),
                        create: jest.fn()
                    },
                    genders: {
                        findUnique: jest.fn().mockResolvedValue(null),
                        create: jest.fn().mockResolvedValue(mockGender)
                    },
                    blood_types: {
                        findUnique: jest.fn(),
                        create: jest.fn()
                    },
                    patients: {
                        create: jest.fn().mockResolvedValue(mockPatient)
                    }
                };
                return callback(txMock);
            }) as any;

            const inputFemale = { ...validInput, gender: 'F', blood_type: undefined };
            const result = await registerPatient(mockPrisma, inputFemale);

            expect(result).toEqual(mockPatient);
            expect(txMock.genders.findUnique).toHaveBeenCalledWith({ where: { code: 'F' } });
            expect(txMock.genders.create).toHaveBeenCalledWith({ data: { code: 'F' } });
        });

        it('should hash password with Argon2', async () => {
            const mockPatientRole = { id: 1, name: 'patient' };
            const mockUser = { id: BigInt(1) };
            const mockCountry = { id: BigInt(126) };
            const mockGender = { id: 1 };
            const mockPatient = {
                id: BigInt(1),
                user_id: BigInt(1),
                gender_id: 1,
                blood_type_id: null,
                phone_number: 'encrypted_+1234567890',
                country_id: BigInt(126)
            };

            (mockPrisma.roles.findUnique as jest.Mock).mockResolvedValue(mockPatientRole);
            (argon2.hash as jest.Mock).mockResolvedValue('hashed_password_123');

            mockPrisma.$transaction = jest.fn(async (callback) => {
                const txMock = {
                    users: { create: jest.fn().mockResolvedValue(mockUser) },
                    countries: { findFirst: jest.fn().mockResolvedValue(mockCountry), create: jest.fn() },
                    genders: { findUnique: jest.fn().mockResolvedValue(mockGender), create: jest.fn() },
                    blood_types: { findUnique: jest.fn(), create: jest.fn() },
                    patients: { create: jest.fn().mockResolvedValue(mockPatient) }
                };
                return callback(txMock);
            }) as any;

            await registerPatient(mockPrisma, validInput);

            expect(argon2.hash).toHaveBeenCalledWith('password123');
        });
    });
});

