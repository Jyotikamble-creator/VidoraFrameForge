import { PrismaClient } from "@prisma/client"
import { Logger, LogTags } from "@/lib/logger"

const DATABASE_URL = process.env.DATABASE_URL
const DATABASE_URL_UNPOOLED = process.env.DATABASE_URL_UNPOOLED
export const DB_DISABLED = !DATABASE_URL

if (DB_DISABLED) {
  Logger.w(LogTags.DB_CONNECT, "DATABASE_URL is not defined. PostgreSQL connection is temporarily disabled.")
}

// Extend global type for Prisma caching
declare global {
  var prisma: PrismaClient | undefined
}

let prisma: PrismaClient

const prismaClientOptions = {
  // Use unpooled connection for migrations, regular connection for queries
  // This approach is compatible with Prisma 5.22+
  ...(process.env.NODE_ENV === "production" && {
    datasources: {
      db: {
        url: DATABASE_URL,
      },
    },
  }),
}

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient(prismaClientOptions)
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient(prismaClientOptions)
  }
  prisma = global.prisma
}

export { prisma }

export async function connectToDatabase() {
  if (DB_DISABLED) {
    Logger.w(LogTags.DB_CONNECT, "Skipping database connection because DATABASE_URL is disabled")
    return
  }

  try {
    // Prisma connects automatically on first query, but we can ensure connection with $connect()
    await prisma.$connect()
    Logger.i(LogTags.DB_CONNECT, "PostgreSQL Connected successfully")
  } catch (error) {
    Logger.e(LogTags.DB_CONNECT, `PostgreSQL Connection Error: ${String(error)}`)
    throw error
  }
}

export async function disconnectFromDatabase() {
  if (DB_DISABLED) {
    Logger.d(LogTags.DB_CONNECT, "Skipping database disconnect because DATABASE_URL is disabled")
    return
  }

  try {
    await prisma.$disconnect()
    Logger.i(LogTags.DB_CONNECT, "PostgreSQL Disconnected successfully")
  } catch (error) {
    Logger.e(LogTags.DB_CONNECT, `Error disconnecting from PostgreSQL: ${String(error)}`)
    throw error
  }
}
