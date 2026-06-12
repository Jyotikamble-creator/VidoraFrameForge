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

const prismaClientOptions = {
  ...(process.env.NODE_ENV === "production" && DATABASE_URL ? {
    datasources: {
      db: {
        url: DATABASE_URL,
      },
    },
  } : {}),
}

// Lazy initialization to prevent Prisma from connecting or throwing errors during Next.js build
class PrismaSingleton {
  private static instance: PrismaClient | undefined;

  public static getInstance(): PrismaClient {
    if (process.env.NODE_ENV === "production") {
      if (!this.instance) {
        this.instance = new PrismaClient(prismaClientOptions)
      }
      return this.instance
    } else {
      if (!global.prisma) {
        global.prisma = new PrismaClient(prismaClientOptions)
      }
      return global.prisma
    }
  }
}

export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    const client = PrismaSingleton.getInstance()
    // Bind methods to the client instance so 'this' works correctly
    const value = (client as any)[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  }
})


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
