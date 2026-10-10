import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

export const isDatabaseConfigured = Boolean(process.env.DATABASE_URL);

function createClient() {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
}

// One client per server process. In development, keep it on globalThis so hot reloads
// don't open a new connection pool every time a file changes.
const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createClient> };

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
