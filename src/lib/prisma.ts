import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const PRISMA_SCHEMA_VERSION = "20260613110000";

const globalForPrisma = globalThis as unknown as {
    prisma?: PrismaClient;
    prismaSchemaVersion?: string;
};

function supportsCurrentSchema(client: PrismaClient | undefined) {
    if (!client) return false;

    const runtimeClient = client as PrismaClient & {
        pageShare?: {
            findUnique?: unknown;
        };
        pageShareInvite?: {
            findMany?: unknown;
        };
    };

    return (
        typeof runtimeClient.pageShare?.findUnique === "function" &&
        typeof runtimeClient.pageShareInvite?.findMany === "function"
    );
}

const prisma =
    globalForPrisma.prisma &&
    globalForPrisma.prismaSchemaVersion === PRISMA_SCHEMA_VERSION &&
    supportsCurrentSchema(globalForPrisma.prisma)
        ? globalForPrisma.prisma
        : new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
    globalForPrisma.prismaSchemaVersion = PRISMA_SCHEMA_VERSION;
}

export default prisma;
