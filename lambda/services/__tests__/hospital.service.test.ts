import { getAllHospitals } from '../hospital.service';
import { PrismaClient } from '../../../lib/generated/prisma';

describe('Hospital Service', () => {
    let mockPrisma: jest.Mocked<PrismaClient>;

    beforeEach(() => {
        mockPrisma = {
            hospitals: {
                findMany: jest.fn(),
            },
        } as any;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getAllHospitals', () => {
        it('should return all hospitals', async () => {
            const mockHospitals = [
                {
                    id: BigInt(1),
                    name: 'Mount Lebanon Hospital',
                    region: 'Baabda',
                    phone_number: '05/957000'
                },
                {
                    id: BigInt(2),
                    name: 'Hayek Hospital',
                    region: 'Beirut',
                    phone_number: '01/481333'
                }
            ];

            (mockPrisma.hospitals.findMany as jest.Mock).mockResolvedValue(mockHospitals);

            const result = await getAllHospitals(mockPrisma);

            expect(result).toEqual(mockHospitals);
            expect(mockPrisma.hospitals.findMany).toHaveBeenCalledWith({
                select: { id: true, name: true, region: true, phone_number: true }
            });
        });

        it('should return empty array when no hospitals exist', async () => {
            (mockPrisma.hospitals.findMany as jest.Mock).mockResolvedValue([]);

            const result = await getAllHospitals(mockPrisma);

            expect(result).toEqual([]);
            expect(mockPrisma.hospitals.findMany).toHaveBeenCalled();
        });

        it('should handle hospitals with null phone numbers', async () => {
            const mockHospitals = [
                {
                    id: BigInt(1),
                    name: 'Test Hospital',
                    region: 'Test Region',
                    phone_number: null
                }
            ];

            (mockPrisma.hospitals.findMany as jest.Mock).mockResolvedValue(mockHospitals);

            const result = await getAllHospitals(mockPrisma);

            expect(result).toEqual(mockHospitals);
            expect(result[0].phone_number).toBeNull();
        });
    });
});

