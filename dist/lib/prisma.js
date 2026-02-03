import "dotenv/config";
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from "../generated/prisma/client.js";
let prismaInstance = null;
export function getPrisma() {
    if (prismaInstance === null) {
        const connectionString = `${process.env.DATABASE_URL}`;
        const adapter = new PrismaPg({ connectionString });
        prismaInstance = new PrismaClient({ adapter });
    }
    return prismaInstance;
}
export async function disconnectPrisma() {
    if (prismaInstance !== null) {
        await prismaInstance.$disconnect();
        prismaInstance = null;
    }
}
